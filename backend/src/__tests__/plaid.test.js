const request = require('supertest')

jest.mock('../config/plaid', () => ({
  linkTokenCreate: jest.fn(),
  itemPublicTokenExchange: jest.fn(),
  accountsGet: jest.fn(),
  transactionsSync: jest.fn(),
  itemRemove: jest.fn(),
}))

const plaidClient = require('../config/plaid')
const app = require('../app')

async function signupAndGetToken(email) {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'password123' })
  return response.body.token
}

function authed(req, token) {
  return req.set('Authorization', `Bearer ${token}`)
}

const outflowTransaction = {
  transaction_id: 'txn-1',
  account_id: 'acc-1',
  amount: 12.5,
  iso_currency_code: 'USD',
  date: '2026-07-10',
  name: 'Starbucks',
  merchant_name: 'Starbucks',
  pending: false,
  personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' },
}

const inflowTransaction = {
  transaction_id: 'txn-2',
  account_id: 'acc-1',
  amount: -2000,
  iso_currency_code: 'USD',
  date: '2026-07-01',
  name: 'Payroll',
  merchant_name: null,
  pending: false,
  personal_finance_category: { primary: 'INCOME' },
}

beforeEach(() => {
  jest.clearAllMocks()

  plaidClient.linkTokenCreate.mockResolvedValue({
    data: { link_token: 'link-sandbox-token' },
  })
  plaidClient.itemPublicTokenExchange.mockResolvedValue({
    data: { access_token: 'access-sandbox-123', item_id: 'item-123' },
  })
  plaidClient.accountsGet.mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'acc-1',
          name: 'Plaid Checking',
          mask: '0000',
          type: 'depository',
          subtype: 'checking',
          balances: { iso_currency_code: 'USD', current: 1500.25 },
        },
      ],
    },
  })
  plaidClient.itemRemove.mockResolvedValue({ data: { removed: true } })
  plaidClient.transactionsSync.mockResolvedValue({
    data: {
      added: [outflowTransaction, inflowTransaction],
      modified: [],
      removed: [],
      has_more: false,
      next_cursor: 'cursor-1',
    },
  })
})

async function link(token, overrides = {}) {
  return authed(request(app).post('/api/plaid/exchange'), token).send({
    public_token: 'public-sandbox-token',
    institution_id: 'ins_1',
    institution_name: 'Chase',
    ...overrides,
  })
}

describe('POST /api/plaid/link-token', () => {
  it('returns a link token for a logged-in user', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/plaid/link-token'), token)

    expect(response.status).toBe(200)
    expect(response.body.link_token).toBe('link-sandbox-token')
    expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({ transactions: { days_requested: 365 } })
    )
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).post('/api/plaid/link-token')
    expect(response.status).toBe(401)
  })
})

describe('POST /api/plaid/exchange', () => {
  it('stores accounts (with balance) and imports both spending and income transactions', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await link(token)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ accounts: 1, imported: 2 })

    const accounts = await authed(request(app).get('/api/accounts'), token)
    expect(accounts.body.accounts).toHaveLength(1)
    expect(accounts.body.accounts[0]).toMatchObject({
      name: 'Plaid Checking',
      mask: '0000',
      subtype: 'checking',
      currency: 'USD',
      balance: 1500.25,
      convertedBalance: 1500.25,
      baseCurrency: 'USD',
    })

    const expenses = await authed(request(app).get('/api/expenses'), token)
    expect(expenses.body.expenses).toHaveLength(2)
    expect(expenses.body.expenses).toContainEqual(
      expect.objectContaining({
        amount: 12.5,
        type: 'expense',
        category: 'Dining',
        merchant: 'Starbucks',
        source: 'plaid',
        pending: false,
      })
    )
    expect(expenses.body.expenses).toContainEqual(
      expect.objectContaining({
        amount: 2000,
        type: 'income',
        category: 'Income',
        note: 'Payroll',
        source: 'plaid',
      })
    )
  })

  it('rejects a missing public_token', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/plaid/exchange'), token).send({})

    expect(response.status).toBe(400)
  })

  it('rejects a request without a token', async () => {
    const response = await request(app)
      .post('/api/plaid/exchange')
      .send({ public_token: 'x' })
    expect(response.status).toBe(401)
  })

  it('blocks a second connection to the same institution without confirmation', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    const response = await link(token)

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({ duplicate: true, institutionName: 'Chase' })
    expect(plaidClient.itemPublicTokenExchange).toHaveBeenCalledTimes(1)
  })

  it('allows a second connection to the same institution when confirmed', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    plaidClient.itemPublicTokenExchange.mockResolvedValueOnce({
      data: { access_token: 'access-sandbox-456', item_id: 'item-456' },
    })
    plaidClient.accountsGet.mockResolvedValueOnce({
      data: {
        accounts: [
          {
            account_id: 'acc-2',
            name: 'Plaid Savings',
            mask: '1111',
            type: 'depository',
            subtype: 'savings',
            balances: { iso_currency_code: 'USD', current: 500 },
          },
        ],
      },
    })
    const response = await link(token, { confirm_duplicate: true })

    expect(response.status).toBe(201)
    expect(plaidClient.itemPublicTokenExchange).toHaveBeenCalledTimes(2)
  })

  it('does not block connections to a different institution', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    plaidClient.itemPublicTokenExchange.mockResolvedValueOnce({
      data: { access_token: 'access-sandbox-789', item_id: 'item-789' },
    })
    plaidClient.accountsGet.mockResolvedValueOnce({
      data: {
        accounts: [
          {
            account_id: 'acc-3',
            name: 'Wells Checking',
            mask: '2222',
            type: 'depository',
            subtype: 'checking',
            balances: { iso_currency_code: 'USD', current: 800 },
          },
        ],
      },
    })
    const response = await link(token, { institution_id: 'ins_2', institution_name: 'Wells Fargo' })

    expect(response.status).toBe(201)
  })
})

describe('POST /api/plaid/sync', () => {
  it('does not duplicate transactions on repeated syncs', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    await authed(request(app).post('/api/plaid/sync'), token)
    await authed(request(app).post('/api/plaid/sync'), token)

    const expenses = await authed(request(app).get('/api/expenses'), token)
    expect(expenses.body.expenses).toHaveLength(2)
  })

  it('removes expenses that Plaid reports as removed', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    plaidClient.transactionsSync.mockResolvedValueOnce({
      data: {
        added: [],
        modified: [],
        removed: [{ transaction_id: 'txn-1' }],
        has_more: false,
        next_cursor: 'cursor-2',
      },
    })

    await authed(request(app).post('/api/plaid/sync'), token)

    const expenses = await authed(request(app).get('/api/expenses'), token)
    expect(expenses.body.expenses).toHaveLength(1)
    expect(expenses.body.expenses[0]).toMatchObject({ category: 'Income', type: 'income' })
  })
})

describe('cross-user isolation', () => {
  it('never exposes one user’s accounts or imported expenses to another', async () => {
    const janeToken = await signupAndGetToken('jane@example.com')
    const bobToken = await signupAndGetToken('bob@example.com')

    await link(janeToken)

    const bobAccounts = await authed(request(app).get('/api/accounts'), bobToken)
    expect(bobAccounts.body.accounts).toHaveLength(0)

    const bobExpenses = await authed(request(app).get('/api/expenses'), bobToken)
    expect(bobExpenses.body.expenses).toHaveLength(0)
  })
})

describe('GET /api/accounts institution info', () => {
  it('includes institution info on each account', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    const accounts = await authed(request(app).get('/api/accounts'), token)

    expect(accounts.body.accounts[0].item).toMatchObject({
      institutionName: 'Chase',
      institutionId: 'ins_1',
    })
  })
})

describe('DELETE /api/plaid/items/:id', () => {
  it('removes the item, its accounts, and its imported expenses', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    const accountsBefore = await authed(request(app).get('/api/accounts'), token)
    const itemId = accountsBefore.body.accounts[0].item._id

    const response = await authed(request(app).delete(`/api/plaid/items/${itemId}`), token)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ accountsRemoved: 1, expensesRemoved: 2 })
    expect(plaidClient.itemRemove).toHaveBeenCalledWith({ access_token: 'access-sandbox-123' })

    const accountsAfter = await authed(request(app).get('/api/accounts'), token)
    expect(accountsAfter.body.accounts).toHaveLength(0)

    const expensesAfter = await authed(request(app).get('/api/expenses'), token)
    expect(expensesAfter.body.expenses).toHaveLength(0)
  })

  it('leaves manual expenses untouched', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)
    await authed(request(app).post('/api/expenses'), token).send({
      amount: 20,
      category: 'Groceries',
      date: '2026-07-15',
      note: 'Manual grocery run',
      type: 'expense',
    })

    const accountsBefore = await authed(request(app).get('/api/accounts'), token)
    const itemId = accountsBefore.body.accounts[0].item._id

    await authed(request(app).delete(`/api/plaid/items/${itemId}`), token)

    const expensesAfter = await authed(request(app).get('/api/expenses'), token)
    expect(expensesAfter.body.expenses).toHaveLength(1)
    expect(expensesAfter.body.expenses[0]).toMatchObject({ note: 'Manual grocery run' })
  })

  it('returns 404 for an item that does not belong to the user', async () => {
    const janeToken = await signupAndGetToken('jane@example.com')
    const bobToken = await signupAndGetToken('bob@example.com')
    await link(janeToken)

    const accounts = await authed(request(app).get('/api/accounts'), janeToken)
    const itemId = accounts.body.accounts[0].item._id

    const response = await authed(request(app).delete(`/api/plaid/items/${itemId}`), bobToken)

    expect(response.status).toBe(404)
  })

  it('returns 404 for a nonexistent item id', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(
      request(app).delete('/api/plaid/items/507f1f77bcf86cd799439011'),
      token
    )

    expect(response.status).toBe(404)
  })
})
