import type { Request, Response } from 'express'
import * as AuthService from '../services/auth.service'
import { prisma } from '@db/prisma'
import type { AuthenticatedRequest } from '@/middleware/auth.middleware'
import { asyncHandler } from '@/common/http/async-handler'

export const register = asyncHandler(async (req, res, _next) => {
  const result = await AuthService.register(req.body.email, req.body.password)
  res.status(result.status).json(result.body)
})

export const login = asyncHandler(async (req, res, _next) => {
  const result = await AuthService.login(req.body.email, req.body.password)
  res.status(result.status).json(result.body)
})

export const me = asyncHandler(async (req: AuthenticatedRequest, res, _next) => {
  const userId = req.user!.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  })

  res.json({ user })
})

export const forgotPassword = asyncHandler(async (req: Request, res: Response, _next) => {
  const result = await AuthService.forgotPassword(req.body.email)
  res.status(result.status).json(result.body)
})

export const resetPassword = asyncHandler(async (req: Request, res: Response, _next) => {
  const result = await AuthService.resetPassword(req.body.token, req.body.newPassword)
  res.status(result.status).json(result.body)
})

export const verifyEmail = asyncHandler(async (req: Request, res: Response, _next) => {
  const result = await AuthService.verifyEmail(req.body.token)
  res.status(result.status).json(result.body)
})

export const resendVerification = asyncHandler(async (req: Request, res: Response, _next) => {
  const result = await AuthService.resendVerification(req.body.email)
  res.status(result.status).json(result.body)
})
