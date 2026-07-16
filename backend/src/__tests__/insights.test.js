const request = require('supertest')
const app = require('../app')

jest.mock('../services/mlClient')

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
    .send({ amount: 5, category: 'Coffee', date: '2026-07-01', ...overrides })
  return res.body.expense
}

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
