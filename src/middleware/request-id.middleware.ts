import type { NextFunction, Request, Response, RequestHandler } from 'express'
import crypto from 'crypto'

export const requestIdMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const existing = req.header('x-request-id')
  const requestId = existing?.trim() || crypto.randomUUID()

  // attach to response so clients can reference
  res.setHeader('x-request-id', requestId)

  // attach to request for downstream usage
  req.requestId = requestId

  next()
}
