import request from 'supertest'
import { createApp } from '@/app'
import { resetDb } from '@/tests/utils'

describe('Auth - register', () => {
  const app = createApp()

  beforeEach(async () => {
    await resetDb()
  })

  it('registers a user (201)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('test@example.com')
    expect(typeof res.body.token).toBe('string')
  })

  it('returns 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })

    expect(res.status).toBe(400)
  })

  it('returns 400 if email already exists', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' })

    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' })

    expect(res2.status).toBe(409)
  })
})
