import request from 'supertest'
import { createApp } from '@/app'
import { resetDb } from '@/tests/utils'

describe('Auth - login + me', () => {
  const app = createApp()

  beforeEach(async () => {
    await resetDb()
  })

  async function registerUser() {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
  }

  it('logs in (200)', async () => {
    await registerUser()

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.user.email).toBe('test@example.com')
  })

  it('returns 401 for invalid credentials', async () => {
    await registerUser()

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid login payload', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nope', password: '' })

    expect(res.status).toBe(400)
  })

  it('me returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('me returns user with token', async () => {
    await registerUser()
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    const token = login.body.token as string

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)

    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe('test@example.com')
  })
})
