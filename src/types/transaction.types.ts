import type { UUID, ISODateString, Money } from './common'
import type { TransactionStatus } from './enums'

export interface ShippingAddress {
  fullName?: string
  line1?: string
  line2: string
  city?: string
  region?: string
  postcode?: string
  country?: string
  phone?: string
}

export interface Transaction {
  id: UUID
  listingId: UUID
  buyerId: UUID
  sellerId: UUID

  status: TransactionStatus
  price: Money

  stripePaymentIntentId?: string | null
  stripeChargeId?: string | null

  shippingAddress?: ShippingAddress | null
  trackingNumber?: string | null
  shippedAt?: ISODateString | null
  deliveredAt?: ISODateString | null

  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateTransactionInput {
  listingId: UUID
  amount: string
  currency?: string
  shippingAddress?: ShippingAddress
}

export interface UpdateTransactionInput {
  status?: TransactionStatus
  trackingNumber?: string | null
  shippedAt?: ISODateString | null
  deliveredAt?: ISODateString | null
  shippingAddress?: ShippingAddress | null
}
