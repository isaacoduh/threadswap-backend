import type { Request, Response } from 'express'

import * as UsersService from '@/modules/users/services/users.service'
import { patchUserProfileSchema } from '@/modules/users/validators/user.validator'

function getAuthUserId(req: Request): string | null {
  const r = req as Request & { user?: { userId?: string; id?: string } }
  return r.user?.userId ?? r.user?.id ?? null
}

/**
 * GET /api/v1/users/:id
 */
export const getUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing user id' })
  }

  try {
    const profile = await UsersService.getUserProfileById(id)
    return res.status(200).json({ ok: true, profile })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type: statusCode === 404 ? 'not_found' : 'server_error',
      detail: e.message ?? 'Failed to fetch user profile',
    })
  }
}

/**
 * PATCH /api/v1/users/:id
 */
export const patchUserProfile = async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req)
  if (!authUserId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing user id' })
  }

  if (authUserId !== id) {
    return res.status(403).json({ type: 'forbidden', detail: 'Forbidden' })
  }

  // If you're already using validateBody middleware, this parse is redundant.
  // Keep it for safety unless you wire validateBody in routes.
  const parsed = patchUserProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ type: 'validation_error', detail: parsed.error.message })
  }

  try {
    const profile = await UsersService.updateMyProfile({
      userId: id,
      data: parsed.data,
    })

    return res.status(200).json({ ok: true, profile })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type:
        statusCode === 400
          ? 'validation_error'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : statusCode === 409
                ? 'conflict'
                : 'server_error',
      detail: e.message ?? 'Failed to update profile',
    })
  }
}

export const uploadAvatar = async (req: Request, res: Response) => {
  const authUserId = getAuthUserId(req)
  if (!authUserId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing user id' })
  }

  if (authUserId !== id) {
    return res.status(403).json({ type: 'forbidden', detail: 'Forbidden' })
  }

  const file = (req as Request & { file?: Express.Multer.File }).file
  if (!file) {
    return res.status(400).json({ type: 'upload_error', detail: 'Missing avatar file' })
  }

  try {
    const result = await UsersService.uploadMyAvatar({ userId: id, file })
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type: statusCode === 400 ? 'validation_error' : 'server_error',
      detail: e.message ?? 'Failed to upload avatar',
    })
  }
}
