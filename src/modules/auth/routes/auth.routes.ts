import { Router } from 'express'
import * as AuthController from '../controllers/auth.controller'
import { requireAuth } from '@/middleware/auth.middleware'
import { validateBody } from '@/common/validation/validation.middleware'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../auth.schemas'

export const authRouter = Router()

authRouter.post('/register', validateBody(registerSchema), AuthController.register)
authRouter.post('/login', validateBody(loginSchema), AuthController.login)

authRouter.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  AuthController.forgotPassword
)
authRouter.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword)

authRouter.post('/verify-email', validateBody(verifyEmailSchema), AuthController.verifyEmail)
authRouter.post(
  '/resend-verification',
  validateBody(resendVerificationSchema),
  AuthController.resendVerification
)

authRouter.get('/me', requireAuth, AuthController.me)
