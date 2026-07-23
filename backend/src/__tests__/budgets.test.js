const request = require('supertest')
const app = require('../app')

async function signupAndGetToken(email = 'a@b.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'hunter22' })
  return res.body.token
}

function authed(req, token) {
  return req.set('Authorization', `Bearer ${token}`)
}

describe('GET /api/budgets', () => {
  it('returns an empty map for a new user', async () => {
    const token = await signupAndGetToken()
    const res = await authed(request(app).get('/api/budgets'), token)
    expect(res.status).toBe(200)
    expect(res.body.budgets).toEqual({})
  })

  it('401s without a token', async () => {
    const res = await request(app).get('/api/budgets')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/budgets', () => {
  it('creates a budget and returns the updated map', async () => {
    const token = await signupAndGetToken()
    const res = await authed(request(app).put('/api/budgets'), token).send({
      category: 'Groceries',
      amount: 400,
    })
    expect(res.status).toBe(200)
    expect(res.body.budgets).toEqual({ Groceries: 400 })
  })

  it('updates an existing budget', async () => {
    const token = await signupAndGetToken()
    await authed(request(app).put('/api/budgets'), token).send({ category: 'Groceries', amount: 400 })
    const res = await authed(request(app).put('/api/budgets'), token).send({
      category: 'Groceries',
      amount: 250,
    })
    expect(res.body.budgets).toEqual({ Groceries: 250 })
  })

  it('accepts a slash category', async () => {
    const token = await signupAndGetToken()
    const res = await authed(request(app).put('/api/budgets'), token).send({
      category: 'Housing/Utilities',
      amount: 1200,
    })
    expect(res.status).toBe(200)
    expect(res.body.budgets['Housing/Utilities']).toBe(1200)
  })

  it.each([
    ['unknown category', { category: 'Coffee', amount: 100 }],
    ['non-budgetable category', { category: 'Income', amount: 100 }],
    ['missing category', { amount: 100 }],
    ['missing amount', { category: 'Groceries' }],
    ['zero amount', { category: 'Groceries', amount: 0 }],
    ['negative amount', { category: 'Groceries', amount: -5 }],
    ['non-numeric amount', { category: 'Groceries', amount: 'lots' }],
  ])('400s on %s', async (_label, body) => {
    const token = await signupAndGetToken()
    const res = await authed(request(app).put('/api/budgets'), token).send(body)
    expect(res.status).toBe(400)
  })

  it('401s without a token', async () => {
    const res = await request(app).put('/api/budgets').send({ category: 'Groceries', amount: 400 })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/budgets/:category', () => {
  it('removes a budget and returns the updated map', async () => {
    const token = await signupAndGetToken()
    await authed(request(app).put('/api/budgets'), token).send({ category: 'Groceries', amount: 400 })
    await authed(request(app).put('/api/budgets'), token).send({ category: 'Dining', amount: 200 })
    const res = await authed(request(app).delete('/api/budgets/Groceries'), token)
    expect(res.status).toBe(200)
    expect(res.body.budgets).toEqual({ Dining: 200 })
  })

  it('removes a slash category via URL encoding', async () => {
    const token = await signupAndGetToken()
    await authed(request(app).put('/api/budgets'), token).send({
      category: 'Housing/Utilities',
      amount: 1200,
    })
    const res = await authed(request(app).delete('/api/budgets/Housing%2FUtilities'), token)
    expect(res.status).toBe(200)
    expect(res.body.budgets).toEqual({})
  })

  it('404s when that category has no budget', async () => {
    const token = await signupAndGetToken()
    const res = await authed(request(app).delete('/api/budgets/Groceries'), token)
    expect(res.status).toBe(404)
  })

  it('401s without a token', async () => {
    const res = await request(app).delete('/api/budgets/Groceries')
    expect(res.status).toBe(401)
  })
})

describe('budgets isolation and /me exposure', () => {
  it('keeps budgets per-user', async () => {
    const aliceToken = await signupAndGetToken('alice@b.com')
    const bobToken = await signupAndGetToken('bob@b.com')
    await authed(request(app).put('/api/budgets'), aliceToken).send({
      category: 'Groceries',
      amount: 400,
    })
    const res = await authed(request(app).get('/api/budgets'), bobToken)
    expect(res.body.budgets).toEqual({})
  })

  it('includes budgets in GET /api/auth/me', async () => {
    const token = await signupAndGetToken()
    await authed(request(app).put('/api/budgets'), token).send({ category: 'Dining', amount: 200 })
    const res = await authed(request(app).get('/api/auth/me'), token)
    expect(res.status).toBe(200)
    expect(res.body.user.budgets).toEqual({ Dining: 200 })
  })
})
