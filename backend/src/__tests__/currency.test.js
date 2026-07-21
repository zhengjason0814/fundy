const request = require('supertest')
const app = require('../app')
const { __clearCache } = require('../services/exchangeRates')

const RATE_TABLES = {
  USD: { EUR: 0.8, GBP: 0.5 },
  EUR: { USD: 1.25, GBP: 0.625 },
}

async function signupAndGetToken(email) {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'password123' })
  return response.body.token
}

function authed(req, token) {
  return req.set('Authorization', `Bearer ${token}`)
}

beforeEach(() => {
  __clearCache()
  global.fetch = jest.fn(async (url) => {
    const base = new URL(url).searchParams.get('base')
    return {
      ok: true,
      json: async () => ({ base, rates: RATE_TABLES[base] || {} }),
    }
  })
})

describe('multi-currency conversion', () => {
  it('converts a foreign expense using its transaction-date rate', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send({
      amount: 40,
      currency: 'EUR',
      category: 'Groceries',
      date: '2026-05-01',
      note: 'Market run',
    })

    expect(response.status).toBe(201)
    expect(response.body.expense).toMatchObject({
      currency: 'EUR',
      convertedAmount: 50,
      baseCurrency: 'USD',
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toContain('/2026-05-01')
    expect(global.fetch.mock.calls[0][0]).toContain('base=USD')
  })

  it('does not convert or fetch when the expense is already in the base currency', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send({
      amount: 50,
      currency: 'USD',
      category: 'Dining',
      date: '2026-05-01',
      note: 'Lunch',
    })

    expect(response.body.expense.convertedAmount).toBe(50)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('caches rates per date so same-date expenses fetch only once', async () => {
    const token = await signupAndGetToken('jane@example.com')

    await authed(request(app).post('/api/expenses'), token).send({
      amount: 40,
      currency: 'EUR',
      category: 'Groceries',
      date: '2026-05-01',
      note: 'Market run',
    })
    await authed(request(app).post('/api/expenses'), token).send({
      amount: 20,
      currency: 'EUR',
      category: 'Transportation',
      date: '2026-05-01',
      note: 'Bus fare',
    })

    const list = await authed(request(app).get('/api/expenses'), token)

    expect(list.body.expenses).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

describe('PATCH /api/auth/me', () => {
  it('changes the base currency and re-totals expenses into it', async () => {
    const token = await signupAndGetToken('jane@example.com')

    await authed(request(app).post('/api/expenses'), token).send({
      amount: 50,
      currency: 'USD',
      category: 'Dining',
      date: '2026-05-01',
      note: 'Lunch',
    })

    const patch = await authed(request(app).patch('/api/auth/me'), token).send({
      baseCurrency: 'EUR',
    })
    expect(patch.status).toBe(200)
    expect(patch.body.user.baseCurrency).toBe('EUR')

    const list = await authed(request(app).get('/api/expenses'), token)
    expect(list.body.baseCurrency).toBe('EUR')
    expect(list.body.expenses[0]).toMatchObject({
      currency: 'USD',
      convertedAmount: 40,
      baseCurrency: 'EUR',
    })
  })

  it('rejects a missing baseCurrency', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).patch('/api/auth/me'), token).send({})

    expect(response.status).toBe(400)
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).patch('/api/auth/me').send({ baseCurrency: 'EUR' })

    expect(response.status).toBe(401)
  })
})
