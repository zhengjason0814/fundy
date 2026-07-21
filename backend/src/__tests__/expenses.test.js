const request = require('supertest')
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

const groceries = {
  amount: 42.5,
  category: 'Groceries',
  date: '2026-07-10',
  note: 'Weekly shop',
  type: 'expense',
}

describe('POST /api/expenses', () => {
  it('creates an expense for the logged-in user', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send(groceries)

    expect(response.status).toBe(201)
    expect(response.body.expense).toMatchObject({
      amount: 42.5,
      category: 'Groceries',
      note: 'Weekly shop',
    })
  })

  it('rejects missing required fields', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send({
      amount: 10,
    })

    expect(response.status).toBe(400)
  })

  it('rejects a missing type', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send({
      amount: 10,
      category: 'Groceries',
      date: '2026-07-10',
      note: 'Snacks',
    })

    expect(response.status).toBe(400)
  })

  it('rejects an invalid type', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send({
      ...groceries,
      type: 'refund',
    })

    expect(response.status).toBe(400)
  })

  it('creates an income entry', async () => {
    const token = await signupAndGetToken('jane@example.com')

    const response = await authed(request(app).post('/api/expenses'), token).send({
      amount: 2000,
      category: 'Income',
      date: '2026-07-10',
      note: 'Paycheck',
      type: 'income',
    })

    expect(response.status).toBe(201)
    expect(response.body.expense).toMatchObject({ type: 'income', category: 'Income' })
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).post('/api/expenses').send(groceries)

    expect(response.status).toBe(401)
  })
})

describe('GET /api/expenses', () => {
  it('returns only the requesting user’s expenses, newest first', async () => {
    const janeToken = await signupAndGetToken('jane@example.com')
    const bobToken = await signupAndGetToken('bob@example.com')

    await authed(request(app).post('/api/expenses'), janeToken).send({
      ...groceries,
      date: '2026-07-01',
    })
    await authed(request(app).post('/api/expenses'), janeToken).send({
      amount: 15,
      category: 'Transportation',
      date: '2026-07-12',
      note: 'Bus fare',
      type: 'expense',
    })
    await authed(request(app).post('/api/expenses'), bobToken).send({
      amount: 99,
      category: 'Other',
      date: '2026-07-05',
      note: 'Misc',
      type: 'expense',
    })

    const response = await authed(request(app).get('/api/expenses'), janeToken)

    expect(response.status).toBe(200)
    expect(response.body.expenses).toHaveLength(2)
    expect(response.body.expenses.map((e) => e.category)).toEqual(['Transportation', 'Groceries'])
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).get('/api/expenses')

    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/expenses/:id', () => {
  it('deletes the user’s own expense', async () => {
    const token = await signupAndGetToken('jane@example.com')
    const created = await authed(request(app).post('/api/expenses'), token).send(groceries)
    const id = created.body.expense._id

    const response = await authed(request(app).delete(`/api/expenses/${id}`), token)

    expect(response.status).toBe(200)
    expect(response.body.deleted).toBe(id)

    const list = await authed(request(app).get('/api/expenses'), token)
    expect(list.body.expenses).toHaveLength(0)
  })

  it('returns 404 when deleting the same expense twice', async () => {
    const token = await signupAndGetToken('jane@example.com')
    const created = await authed(request(app).post('/api/expenses'), token).send(groceries)
    const id = created.body.expense._id

    await authed(request(app).delete(`/api/expenses/${id}`), token)
    const response = await authed(request(app).delete(`/api/expenses/${id}`), token)

    expect(response.status).toBe(404)
  })

  it('refuses to delete another user’s expense', async () => {
    const janeToken = await signupAndGetToken('jane@example.com')
    const bobToken = await signupAndGetToken('bob@example.com')
    const created = await authed(request(app).post('/api/expenses'), janeToken).send(groceries)
    const id = created.body.expense._id

    const response = await authed(request(app).delete(`/api/expenses/${id}`), bobToken)

    expect(response.status).toBe(404)

    const janesList = await authed(request(app).get('/api/expenses'), janeToken)
    expect(janesList.body.expenses).toHaveLength(1)
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).delete('/api/expenses/000000000000000000000000')

    expect(response.status).toBe(401)
  })
})
