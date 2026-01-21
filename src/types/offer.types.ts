import type { UUID, ISODateString, Money } from './common'
import type { OfferStatus } from './enums'

export interface Offer {
  id: UUID
  listingId: UUID
  buyerId: UUID
  sellerId: UUID

  price: Money
  status: OfferStatus
  note?: string | null

  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateOfferInput {
  listingId: UUID
  amount: string
  currency?: string
  note?: string
}

export interface UpdateOfferStatusInput {
  status: OfferStatus
}
