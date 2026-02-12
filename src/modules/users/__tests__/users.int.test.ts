/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { prisma } from '@/db/prisma'
import { createApp } from '@/app'

// mock s3 (no aws needed)
jest.mock('@/modules/uploads/services/s3.service', () => ({
  uploadFileFromPath: jest.fn(async ({ key }: any) => ({
    bucket: 'test-bucket',
    key: key ?? `avatars/test/${Date.now()}.png`,
  })),
  deleteObject: jest.fn(async () => undefined),
  signGetObjectUrl: jest.fn(async ({ key }: any) => `https://signed.test.local/${key}`),
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

describe('Users Profile (integration)', () => {
  const app = createApp()

  let tokenA: string
  let tokenB: string
  let userAId: string
  let userBId: string

  let listingId: string
  let transactionId: string
  let reviewId: string

  let avatarFilePath: string

  beforeAll(async () => {
    // envs used in upload stack
    process.env.S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL ?? 'https://cdn.test.local'
    process.env.MAX_AVATAR_FILE_SIZE = process.env.MAX_AVATAR_FILE_SIZE ?? String(3 * 1024 * 1024)
    process.env.AVATAR_SIGNED_URL_TTL_SECONDS = process.env.AVATAR_SIGNED_URL_TTL_SECONDS ?? '600'

    avatarFilePath = await makeTempPngFile('avatar.png')

    // register user A
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `userA_${Date.now()}@example.com`,
        password: 'Test1234!',
      })

    // login user A
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: (
          await prisma.user.findFirst({ orderBy: { createdAt: 'desc' }, select: { email: true } })
        )?.email,
        password: 'Test1234!',
      })

    tokenA = pickToken(loginA.body)
    expect(tokenA).toBeTruthy()

    userAId = (await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }))!.id

    // register user B
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `userB_${Date.now()}@example.com`,
        password: 'Test1234!',
      })

    // login user B
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: (
          await prisma.user.findFirst({ orderBy: { createdAt: 'desc' }, select: { email: true } })
        )?.email,
        password: 'Test1234!',
      })

    tokenB = pickToken(loginB.body)
    expect(tokenB).toBeTruthy()

    userBId = (await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }))!.id

    // Seed stats for user A:
    // - 1 listing
    // - 1 completed transaction sale
    // - 1 review received (rating=5)
    const listing = await prisma.listing.create({
      data: {
        sellerId: userAId,
        title: 'Test Listing',
        description: 'Test Description',
        brand: 'Test Brand',
        category: 'BOTTOMS',
        condition: 'EXCELLENT',
        price: '10.00',
        currency: 'GBP',
        status: 'ACTIVE',
        images: [],
      } as any,
      select: { id: true },
    })

    listingId = listing.id

    const tx = await prisma.transaction.create({
      data: {
        listingId,
        buyerId: userBId,
        sellerId: userAId,
        status: 'COMPLETED',
        amount: '10.00',
        currency: 'GBP',
      } as any,
      select: { id: true },
    })

    transactionId = tx.id

    const rev = await prisma.review.create({
      data: {
        transactionId,
        reviewerId: userBId,
        revieweeId: userAId,
        rating: 5,
        comment: 'Great seller',
      } as any,
      select: { id: true },
    })

    reviewId = rev.id
  })

  afterAll(async () => {
    await fs.unlink(avatarFilePath).catch(() => undefined)

    // cleanup in dependency order
    if (reviewId) await prisma.review.deleteMany({ where: { id: reviewId } })
    if (transactionId) await prisma.transaction.deleteMany({ where: { id: transactionId } })
    if (listingId) await prisma.listing.deleteMany({ where: { id: listingId } })

    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => undefined)
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => undefined)

    await prisma?.$disconnect()
  })

  it('GET /api/v1/users/:id returns profile + stats', async () => {
    const res = await request(app).get(`/api/v1/users/${userAId}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    // your controller returns { ok: true, profile }
    expect(res.body.profile?.id).toBe(userAId)
    expect(res.body.profile?.stats).toBeTruthy()

    expect(res.body.profile.stats.listingsCount).toBe(1)
    expect(res.body.profile.stats.salesCount).toBe(1)
    expect(res.body.profile.stats.avgRating).toBe(5)
    expect(res.body.profile.stats.ratingCount).toBe(1)
  })

  it('PATCH /api/v1/users/:id updates profile (owner)', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${userAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        displayName: 'Isaac Updated',
        username: `isaac_${Date.now()}`,
        bio: 'Seller bio here',
        socials: { instagram: 'isaac_insta', website: 'https://example.com' },
      })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    expect(res.body.profile.displayName).toBe('Isaac Updated')
    expect(res.body.profile.bio).toBe('Seller bio here')
    expect(res.body.profile.socials?.instagram).toBe('isaac_insta')
    expect(res.body.profile.socials?.website).toBe('https://example.com')
    expect(typeof res.body.profile.username).toBe('string')
  })

  it('PATCH /api/v1/users/:id forbidden for non-owner', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${userAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ displayName: 'Hacker' })

    expect(res.status).toBe(403)
  })

  it('POST /api/v1/users/:id/avatar uploads avatar (owner)', async () => {
    const res = await request(app)
      .post(`/api/v1/users/${userAId}/avatar`)
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('avatar', avatarFilePath)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    // your upload endpoint returns { ok: true, avatar: { bucket, key, url } }
    expect(res.body.avatar?.key).toBeTruthy()
    expect(res.body.avatar?.url).toBeTruthy()

    // verify persisted
    const u = await prisma.user.findUnique({
      where: { id: userAId },
      select: { avatarKey: true, avatarBucket: true },
    })

    expect(u?.avatarKey).toBeTruthy()
    // avatarBucket can be null, but should not be undefined
    expect(u?.avatarBucket === null || typeof u?.avatarBucket === 'string').toBe(true)
  })

  it('GET /api/v1/users/:id includes avatar object after upload', async () => {
    const res = await request(app).get(`/api/v1/users/${userAId}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    expect(res.body.profile?.avatar).toBeTruthy()
    expect(res.body.profile.avatar.key).toBeTruthy()
    // depending on your service, url may be signed or public
    expect(res.body.profile.avatar.url).toBeTruthy()
  })
})
