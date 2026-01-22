import request from 'supertest'
import { createApp } from '@/app'

describe('health', () => {
  it('GET /health returns 200', async () => {
    const app = createApp()
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })
})
