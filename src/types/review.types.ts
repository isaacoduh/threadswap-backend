import type { UUID, ISODateString } from './common'

export interface Review {
  id: UUID
  transactionId: UUID
  reviewerId: UUID
  revieweeId: UUID

  rating: number
  comment?: string | null

  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateReviewInput {
  transactionId: UUID
  rating: number
  comment?: string
}
