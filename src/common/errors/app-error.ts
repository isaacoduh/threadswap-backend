export type ErrorType =
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server_error'

export class AppError extends Error {
  public readonly status: number
  public readonly type: ErrorType
  public readonly expose: boolean
  public readonly meta?: Record<string, unknown>

  constructor(opts: {
    message: string
    status: number
    type: ErrorType
    expose?: boolean
    meta?: Record<string, unknown>
  }) {
    super(opts.message)
    this.name = this.constructor.name
    this.status = opts.status
    this.type = opts.type
    this.expose = opts.expose ?? true
    this.meta = opts.meta!
  }
}
