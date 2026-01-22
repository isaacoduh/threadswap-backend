import crypto from 'crypto'
import { prisma } from '@db/prisma'
import { hashPassword, verifyPassword } from '@modules/auth/services/password.service'
import { signAcessToken } from '@/modules/auth/services/token.service'
import { ConflictError, UnauthorizedError } from '@/common/errors/http-errors'
import { sendEmail } from '@/common/email/email.service'

const RESET_TTL_MINUTES = Number(process.env.RESET_PASSWORD_TTL_MINUTES ?? 60)
const WEB_APP_URL = String(process.env.WEB_APP_URL ?? '') // e.g. https://threadswap.app
const VERIFY_EMAIL_TTL_MINUTES = Number(process.env.VERIFY_EMAIL_TTL_MINUTES ?? 60 * 24) // 24h default

type ServiceResult<T = unknown> = { status: number; body: T }

export async function register(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ConflictError('Email already registered')

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  })

  const token = signAcessToken({ sub: user.id, email: user.email })
  return { status: 201 as const, body: { user, token } }
}

export async function login(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new UnauthorizedError('Invalid credentials')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw new UnauthorizedError('Invalid credentials')

  const token = signAcessToken({ sub: user.id, email: user.email })

  return {
    status: 200 as const,
    body: {
      user: { id: user.id, email: user.email },
      token,
    },
  }
}

export async function forgotPassword(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()

  const okResponse = {
    status: 200 as const,
    body: { message: 'If an account exists for this email, a reset link has been sent.' },
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return okResponse

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  })

  const resetUrl = WEB_APP_URL
    ? `${WEB_APP_URL.replace(/\/$/, '')}/reset-password?token=${token}`
    : `token:${token}`

  await sendEmail({
    to: user.email,
    subject: 'Reset your ThreadSwap password',
    text:
      `Use this link to reset your password:\n\n${resetUrl}\n\n` +
      `This link expires in ${RESET_TTL_MINUTES} minutes.`,
    html:
      `<p>Use this link to reset your password:</p>` +
      `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
      `<p>This link expires in ${RESET_TTL_MINUTES} minutes.</p>`,
  })

  return okResponse
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return {
      status: 400 as const,
      body: { message: 'Invalid or expired reset token' },
    }
  }

  const passwordHash = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  return {
    status: 200 as const,
    body: { message: 'Password updated successfully' },
  }
}

export async function verifyEmail(token: string): Promise<ServiceResult> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  })

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { status: 400, body: { message: 'Invalid or expired verification token' } }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  return { status: 200, body: { message: 'Email verified successfully' } }
}

export async function resendVerification(emailRaw: string): Promise<ServiceResult> {
  const email = emailRaw.trim().toLowerCase()

  const okResponse: ServiceResult = {
    status: 200,
    body: { message: 'If an account exists for this email, a verification link has been sent.' },
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerifiedAt: true },
  })

  if (!user) return okResponse
  if (user.emailVerifiedAt) return okResponse

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  })

  const verifyToken = crypto.randomBytes(32).toString('hex')
  const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex')
  const verifyExpiresAt = new Date(Date.now() + VERIFY_EMAIL_TTL_MINUTES * 60 * 1000)

  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: verifyTokenHash, expiresAt: verifyExpiresAt },
  })

  const verifyUrl = `${WEB_APP_URL.replace(/\/$/, '')}/verify-email?token=${verifyToken}`

  await sendEmail({
    to: user.email,
    subject: 'Verify your ThreadSwap email',
    text:
      `Verify your email using this link:\n\n${verifyUrl}\n\n` +
      `This link expires in ${VERIFY_EMAIL_TTL_MINUTES} minutes.`,
  })

  return okResponse
}
