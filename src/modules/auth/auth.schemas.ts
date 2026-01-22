import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(20),
})

export const resendVerificationSchema = z.object({
  email: z.string().trim().email(),
})
