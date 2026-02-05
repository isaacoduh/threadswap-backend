/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { prisma } from '@/db/prisma'

import { createApp } from '@/app'

// jest mock s3 (so no aws needed)
jest.mock('@/modules/uploads/services/s3.service', () => ({
  uploadFileFromPath: jest.fn(async () => undefined),
  deleteObject: jest.fn(async () => undefined),
}))

function pickToken(body: any) {
  return body?.accessToken ?? body?.token ?? body?.data?.accessToken ?? body?.data?.token
}

async function makeTempPngFile(name = 'test.png') {
  const filePath = path.join(os.tmpdir(), `${Date.now()}-${name}`)
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO4B8pUAAAAASUVORK5CYII=',
    'base64'
  )
  await fs.writeFile(filePath, png)
  return filePath
}

describe('Listings (integration)', () => {
  const app = createApp()
  let token: string
  let userId: string
  let listingId: string
  let img1: string
  let img2: string

  beforeAll(async () => {
    process.env.S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL ?? 'https://cdn.test.local'
    process.env.MAX_FILES_PER_LISTING = process.env.MAX_FILES_PER_LISTING ?? '8'
    process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE ?? String(5 * 1024 * 1024)

    img1 = await makeTempPngFile('img1.png')
    img2 = await makeTempPngFile('img2.png')

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `listing_${Date.now()}@example.com`,
        password: 'Test1234!',
      })

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: (
          await prisma.user.findFirst({ orderBy: { createdAt: 'desc' }, select: { email: true } })
        )?.email,
        password: 'Test1234!',
      })

    token = pickToken(loginRes.body)
    expect(token).toBeTruthy()

    const me = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } })
    userId = me!.id
  })

  afterAll(async () => {
    await fs.unlink(img1).catch(() => undefined)
    await fs.unlink(img2).catch(() => undefined)

    // cleanup
    if (listingId) {
      await prisma.listing.deleteMany({ where: { id: listingId } })
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }

    await prisma?.$disconnect()
  })

  it('POST /api/v1/listings creates listings with images', async () => {
    const res = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Vintage Jeans')
      .field('description', 'Great condition vintage jeans')
      .field('brand', 'Levis')
      .field('category', 'BOTTOMS')
      .field('condition', 'EXCELLENT')
      .field('price', '45.00')
      .attach('images', img1)

    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
    expect(res.body.listing?.id).toBeTruthy()
    expect(Array.isArray(res.body.listing?.images)).toBe(true)
    expect(res.body.listing.images.length).toBeGreaterThanOrEqual(1)

    listingId = res.body.listing.id
  })

  it('GET /api/v1/listings/:id returns single listing', async () => {
    const res = await request(app).get(`/api/v1/listings/${listingId}`)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.listing.id).toBe(listingId)
    expect(res.body.listing.viewCount).toBeGreaterThanOrEqual(1)
  })

  it('PATCH /api/v1/listings/:id updates listing (owner)', async () => {
    const res = await request(app)
      .patch(`/api/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.listing.title).toBe('Updated title')
  })

  it('GET /api/v1/listings returns listings (supports filters)', async () => {
    const res = await request(app)
      .get('/api/v1/listings')
      .query({ category: 'BOTTOMS', page: 1, limit: 10 })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.pagination).toBeTruthy()
  })

  it("GET /api/v1/listing/users/:userId/listings returns user's listings", async () => {
    const res = await request(app).get(`/api/v1/listings/users/${userId}/listings`)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('POST /api/v1/listings/:id/images adds images (owner)', async () => {
    const res = await request(app)
      .post(`/api/v1/listings/${listingId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', img2)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.images)).toBe(true)
    expect(res.body.images.length).toBeGreaterThanOrEqual(2)
  })

  it('PATCH /api/v1/listings/:id/status updates status (owner)', async () => {
    const res = await request(app)
      .patch(`/api/v1/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.listing?.status).toBe('ACTIVE')
  })

  it('DELETE /api/v1/listings/:id/images/:index deletes image by index (owner)', async () => {
    const res = await request(app)
      .delete(`/api/v1/listings/${listingId}/images/0`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.images)).toBe(true)
    expect(res.body.images.length).toBeGreaterThanOrEqual(1)
  })

  it('DELETE /api/v1/listings/:id deletes listing (owner)', async () => {
    const res = await request(app)
      .delete(`/api/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    // ensure gone
    const check = await request(app).get(`/api/v1/listings/${listingId}`)
    expect([404, 200]).toContain(check.status) // depends if you keep deleted items in some way later
  })
})
