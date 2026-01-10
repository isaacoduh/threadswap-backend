import type { RequestHandler } from 'express'
import morgan from 'morgan'
import { logger } from '@/common/logging/logger'

const m = morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
})

export const httpLoggerMiddleware: RequestHandler = (req, res, next) => {
  m(req, res, next)
}
