const request = require('supertest')

jest.mock('../config/plaid', () => ({
  linkTokenCreate: jest.fn(),
  itemPublicTokenExchange: jest.fn(),
  accountsGet: jest.fn(),
  transactionsSync: jest.fn(),
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
          balances: { iso_currency_code: 'USD' },
        },
      ],
    },
  })
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

async function link(token) {
  return authed(request(app).post('/api/plaid/exchange'), token).send({
    public_token: 'public-sandbox-token',
  })
}

describe('POST /api/plaid/link-token', () => {
  it('returns a link token for a logged-in user', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/plaid/link-token'), token)

    expect(response.status).toBe(200)
    expect(response.body.link_token).toBe('link-sandbox-token')
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).post('/api/plaid/link-token')
    expect(response.status).toBe(401)
  })
})

describe('POST /api/plaid/exchange', () => {
  it('stores accounts and imports only spending transactions', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await link(token)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ accounts: 1, imported: 1 })

    const accounts = await authed(request(app).get('/api/accounts'), token)
    expect(accounts.body.accounts).toHaveLength(1)
    expect(accounts.body.accounts[0]).toMatchObject({
      name: 'Plaid Checking',
      mask: '0000',
      subtype: 'checking',
      currency: 'USD',
    })

    const expenses = await authed(request(app).get('/api/expenses'), token)
    expect(expenses.body.expenses).toHaveLength(1)
    expect(expenses.body.expenses[0]).toMatchObject({
      amount: 12.5,
      category: 'Dining',
      merchant: 'Starbucks',
      source: 'plaid',
      pending: false,
    })
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
})

describe('POST /api/plaid/sync', () => {
  it('does not duplicate transactions on repeated syncs', async () => {
    const token = await signupAndGetToken('jane@example.com')
    await link(token)

    await authed(request(app).post('/api/plaid/sync'), token)
    await authed(request(app).post('/api/plaid/sync'), token)

    const expenses = await authed(request(app).get('/api/expenses'), token)
    expect(expenses.body.expenses).toHaveLength(1)
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
    expect(expenses.body.expenses).toHaveLength(0)
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
