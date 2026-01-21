export type UUID = string

export interface PaginationQuery {
  cursor?: string
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor?: string
}

export type ISODateString = string

export interface Money {
  amount: string
  currency: string
}
