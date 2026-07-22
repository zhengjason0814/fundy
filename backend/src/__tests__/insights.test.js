const request = require('supertest')
const app = require('../app')

jest.mock('../services/mlClient')

const mlClient = require('../services/mlClient')

async function signupAndGetToken(email = 'a@b.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'hunter22' })
  return res.body.token
}

async function createExpense(token, overrides = {}) {
  const res = await request(app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 5,
      category: 'Dining',
      date: '2026-07-01',
      note: 'test note',
      type: 'expense',
      ...overrides,
    })
  return res.body.expense
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/expenses/:id/dismiss-anomaly', () => {
  it('sets anomalyDismissed on own expense', async () => {
    const token = await signupAndGetToken()
    const expense = await createExpense(token)
    const res = await request(app)
      .post(`/api/expenses/${expense._id}/dismiss-anomaly`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.expense.anomalyDismissed).toBe(true)
  })

  it('404s on another user\'s expense', async () => {
    const ownerToken = await signupAndGetToken('owner@b.com')
    const expense = await createExpense(ownerToken)
    const strangerToken = await signupAndGetToken('stranger@b.com')
    const res = await request(app)
      .post(`/api/expenses/${expense._id}/dismiss-anomaly`)
      .set('Authorization', `Bearer ${strangerToken}`)
    expect(res.status).toBe(404)
  })

  it('401s without a token', async () => {
    const res = await request(app).post('/api/expenses/123/dismiss-anomaly')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/insights/prediction', () => {
  it('relays ML result and adds baseCurrency', async () => {
    mlClient.predict.mockResolvedValue({
      status: 'ok',
      current_month: { low: 100, mid: 150, high: 200, spent_so_far: 50 },
      next_month: { low: 90, mid: 140, high: 210 },
    })
    const token = await signupAndGetToken()
    await createExpense(token)
    const res = await request(app)
      .get('/api/insights/prediction')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.baseCurrency).toBe('USD')
    expect(mlClient.predict).toHaveBeenCalledWith(
      [{ date: '2026-07-01', amount: 5 }],
      expect.any(String)
    )
  })

  it('excludes income and Credit Card Payment from the ML input', async () => {
    mlClient.predict.mockResolvedValue({
      status: 'ok',
      current_month: { low: 100, mid: 150, high: 200, spent_so_far: 50 },
      next_month: { low: 90, mid: 140, high: 210 },
    })
    const token = await signupAndGetToken()
    await createExpense(token, { amount: 5, category: 'Dining', date: '2026-07-01' })
    await createExpense(token, {
      amount: 2000,
      category: 'Income',
      date: '2026-07-02',
      type: 'income',
    })
    await createExpense(token, { amount: 300, category: 'Credit Card Payment', date: '2026-07-03' })

    await request(app)
      .get('/api/insights/prediction')
      .set('Authorization', `Bearer ${token}`)

    expect(mlClient.predict).toHaveBeenCalledWith(
      [{ date: '2026-07-01', amount: 5 }],
      expect.any(String)
    )
  })

  it('degrades to unavailable when ML service is down', async () => {
    mlClient.predict.mockRejectedValue(new Error('connect ECONNREFUSED'))
    const token = await signupAndGetToken()
    const res = await request(app)
      .get('/api/insights/prediction')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('unavailable')
  })

  it('401s without a token', async () => {
    const res = await request(app).get('/api/insights/prediction')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/insights/anomalies', () => {
  it('filters out dismissed anomalies', async () => {
    const token = await signupAndGetToken()
    const kept = await createExpense(token, { amount: 95 })
    const dismissed = await createExpense(token, { amount: 90 })
    await request(app)
      .post(`/api/expenses/${dismissed._id}/dismiss-anomaly`)
      .set('Authorization', `Bearer ${token}`)
    mlClient.detectAnomalies.mockResolvedValue({
      status: 'ok',
      anomalies: [
        { id: String(kept._id), category: 'Coffee', amount: 95, score: 6, typical_low: 4, typical_high: 7 },
        { id: String(dismissed._id), category: 'Coffee', amount: 90, score: 5, typical_low: 4, typical_high: 7 },
      ],
    })
    const res = await request(app)
      .get('/api/insights/anomalies')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.anomalies.map((a) => a.id)).toEqual([String(kept._id)])
  })

  it('degrades to unavailable with empty anomalies', async () => {
    mlClient.detectAnomalies.mockRejectedValue(new Error('down'))
    const token = await signupAndGetToken()
    const res = await request(app)
      .get('/api/insights/anomalies')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body).toMatchObject({ status: 'unavailable', anomalies: [] })
  })

  it('excludes income and Credit Card Payment from the ML input', async () => {
    mlClient.detectAnomalies.mockResolvedValue({ status: 'ok', anomalies: [] })
    const token = await signupAndGetToken()
    const kept = await createExpense(token, { amount: 5, category: 'Dining', date: '2026-07-01' })
    await createExpense(token, {
      amount: 2000,
      category: 'Income',
      date: '2026-07-02',
      type: 'income',
    })
    await createExpense(token, { amount: 300, category: 'Credit Card Payment', date: '2026-07-03' })

    await request(app)
      .get('/api/insights/anomalies')
      .set('Authorization', `Bearer ${token}`)

    expect(mlClient.detectAnomalies).toHaveBeenCalledWith([
      { id: String(kept._id), category: 'Dining', amount: 5, date: '2026-07-01' },
    ])
  })
})

describe('GET /api/insights/suggest-category', () => {
  it('400s on missing text', async () => {
    const token = await signupAndGetToken()
    const res = await request(app)
      .get('/api/insights/suggest-category')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400)
  })

  it('relays the suggestion for the given text', async () => {
    mlClient.classify.mockResolvedValue({ status: 'ok', category: 'Groceries', confidence: 0.83 })
    const token = await signupAndGetToken()
    const res = await request(app)
      .get('/api/insights/suggest-category?text=whole+foods')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body).toMatchObject({ status: 'ok', category: 'Groceries' })
    expect(mlClient.classify).toHaveBeenCalledWith('whole foods')
  })
})
