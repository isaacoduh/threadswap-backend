import { AppError } from './app-error'

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', meta?: Record<string, unknown>) {
    super({
      message,
      status: 400,
      type: 'validation_error',
      ...(meta ? { meta } : {}),
    })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super({ message, status: 401, type: 'unauthorized' })
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super({ message, status: 403, type: 'forbidden' })
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super({ message, status: 404, type: 'not_found' })
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', meta?: Record<string, unknown>) {
    super({
      message,
      status: 409,
      type: 'conflict',
      ...(meta ? { meta } : {}),
    })
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests') {
    super({ message, status: 429, type: 'rate_limited' })
  }
}
