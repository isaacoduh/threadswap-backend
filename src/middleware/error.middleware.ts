import type { NextFunction, Request, Response } from 'express'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    type: 'not_found',
    detail: `Route not found: ${req.method} ${req.path}`,
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  console.error('[backend-api] unhandled_error', err)

  res.status(500).json({
    type: 'server_error',
    detail: 'Internal Server Error',
  })
}
