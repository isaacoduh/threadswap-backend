import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      })
    }

    req.body = result.data
    return next()
  }
