import request from 'supertest'
import crypto from 'crypto'
import { createApp } from '@/app'
import { prisma } from '@db/prisma'
import { resetDb } from '@/tests/utils'

describe('Auth - forgot/reset + verify/resend (integration)', () => {
  const app = createApp()

  beforeEach(async () => {
    await resetDb()
  })

  async function registerUser(email = 'test@example.com', password = 'password123') {
    const res = await request(app).post('/api/v1/auth/register').send({ email, password })
    expect(res.status).toBe(201)
    const userId = res.body?.user?.id as string
    expect(typeof userId).toBe('string')
    return { userId, email, password }
  }

  function sha256Hex(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  it('forgot password returns generic 200 for existing + missing email; creates reset token for existing', async () => {
    const { userId } = await registerUser('exists@example.com', 'password123')

    const r1 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'exists@example.com' })

    const r2 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'missing@example.com' })

    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(r1.body).toEqual(r2.body)

    const tokens = await prisma.passwordResetToken.findMany({ where: { userId } })
    expect(tokens.length).toBeGreaterThanOrEqual(1)
  })

  it('reset-password succeeds with valid token; marks token used; login works with new password; reused token fails', async () => {
    const { userId, email } = await registerUser('reset@example.com', 'oldpassword123')
    const rawToken =
      'test_reset_token_9f7c341f10c2a838d38e4560ed4042060c38426d14b569a7c018f93d060af766'
    const tokenHash = sha256Hex(rawToken)

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newpassword123' })

    expect(reset.status).toBe(200)

    const used = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
    expect(used?.usedAt).toBeTruthy()

    // login with new password
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'newpassword123' })

    expect(login.status).toBe(200)
    expect(typeof login.body.token).toBe('string')

    const resetAgain = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'anotherpassword123' })

    expect(resetAgain.status).toBe(400)
  })

  it('reset-password returns 400 for invalid token', async () => {
    await registerUser('invalidtoken@example.com', 'password123')

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'this_is_not_a_real_token_but_long_enough_1234567890',
        newPassword: 'xpassword123',
      })

    expect(res.status).toBe(400)
  })

  it('resend-verification returns generic', async () => {
    const { userId } = await registerUser('verifyme@example.com', 'password123')

    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: null } })
    await prisma.emailVerificationToken.deleteMany({ where: { userId } })

    const r1 = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'verifyme@example.com' })

    const r2 = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'missing@example.com' })

    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(r1.body).toEqual(r2.body)

    const tokens = await prisma.emailVerificationToken.findMany({ where: { userId } })
    expect(tokens.length).toBeGreaterThanOrEqual(1)

    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })
    await prisma.emailVerificationToken.deleteMany({ where: { userId } })

    const r3 = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'verify@example.com' })

    expect(r3.status).toBe(200)
    const tokensAfterVerified = await prisma.emailVerificationToken.findMany({ where: { userId } })
    expect(tokensAfterVerified.length).toBe(0)
  })

  it('verify-email succeeds with valid token; marks token used; reused/invalid token fails', async () => {
    const { userId } = await registerUser('verifytoken@example.com', 'password123')

    // Insert a known verification token (we only store hash)
    const rawToken =
      'test_verify_token_9f7c341f10c2a838d38e4560ed4042060c38426d14b569a7c018f93d060af766'
    const tokenHash = sha256Hex(rawToken)

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const verify = await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken })

    expect(verify.status).toBe(200)

    const used = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } })
    expect(used?.usedAt).toBeTruthy()

    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user?.emailVerifiedAt).toBeTruthy()

    // Reuse must fail
    const verifyAgain = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: rawToken })

    expect(verifyAgain.status).toBe(400)

    // Invalid token must fail
    const invalid = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'invalid_token_but_long_enough_1234567890' })

    expect(invalid.status).toBe(400)
  })
})
