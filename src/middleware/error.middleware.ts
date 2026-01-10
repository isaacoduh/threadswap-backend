import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { logger } from '@/common/logging/logger'
import { AppError } from '@/common/errors/app-error'
import { NotFoundError } from '@/common/errors/http-errors'

function getRequestId(res: Response): string | undefined {
  return res.locals.requestId as string | undefined
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`))
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err)

  const requestId = getRequestId(res)

  // Zod validation errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))

    logger.warn('validation_error', { requestId, issues })

    return res.status(400).json({
      type: 'validation_error',
      detail: 'Invalid request',
      issues,
      requestId,
    })
  }

  // App errors
  if (err instanceof AppError) {
    // Log 4xx as warn, 5xx as error
    const level = err.status >= 500 ? 'error' : 'warn'
    logger[level]('app_error', {
      requestId,
      type: err.type,
      status: err.status,
      detail: err.message,
      meta: err.meta,
    })

    return res.status(err.status).json({
      type: err.type,
      detail: err.message,
      requestId,
      ...(err.meta ? { meta: err.meta } : {}),
    })
  }

  // Unknown error
  logger.error('unhandled_error', { requestId, err })

  return res.status(500).json({
    type: 'server_error',
    detail: 'Internal server error',
    requestId,
  })
}
