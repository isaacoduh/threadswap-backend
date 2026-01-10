import type { NextFunction, Request, Response } from 'express'
import { logger } from '@/common/logging/logger'

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    type: 'not_found',
    detail: `Route not found: ${req.method} ${req.path}`,
    requestId: res.locals.requestId as string | undefined,
  })
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err)

  const requestId = res.locals.requestId as string | undefined
  logger.error('unhandled_error', { requestId, err })

  return res.status(500).json({
    type: 'server_error',
    detail: 'Internal server error',
    requestId,
  })
}
