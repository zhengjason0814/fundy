const request = require('supertest')
const app = require('../app')

const credentials = { email: 'jane@example.com', password: 'password123' }

describe('POST /api/auth/signup', () => {
  it('creates a user and returns a token', async () => {
    const response = await request(app).post('/api/auth/signup').send(credentials)

    expect(response.status).toBe(201)
    expect(response.body.token).toEqual(expect.any(String))
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(credentials)
    const response = await request(app).post('/api/auth/signup').send(credentials)

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('Email already in use')
  })

  it('rejects missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: credentials.email })

    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(credentials)
  })

  it('returns a token for valid credentials', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials)

    expect(response.status).toBe(200)
    expect(response.body.token).toEqual(expect.any(String))
  })

  it('rejects a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Invalid credentials')
  })

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password })

    expect(response.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the logged-in user with a valid token', async () => {
    const signup = await request(app).post('/api/auth/signup').send(credentials)

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.token}`)

    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe(credentials.email)
    expect(response.body.user.passwordHash).toBeUndefined()
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
  })

  it('rejects a garbage token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')

    expect(response.status).toBe(401)
  })
})
