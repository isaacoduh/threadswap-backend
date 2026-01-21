import type { UUID, ISODateString, Money } from './common'
import type { Category, Condition, ListingStatus } from './enums'

export interface Listing {
  id: UUID
  sellerId: UUID

  title: string
  description: string
  brand?: string | null

  category: Category
  condition: Condition
  size?: string | null

  price: Money
  status: ListingStatus
  images: string[]

  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateListingInput {
  title: string
  description?: string
  brand?: string
  category: Category
  condition: Condition
  size?: string
  priceAmount: string
  currency?: string
  images?: string[]
  status?: ListingStatus
}

export interface UpdateListingInput {
  title?: string
  description?: string
  brand?: string | null
  category?: Category
  condition?: Condition
  size?: string | null
  priceAmount?: string
  currency?: string
  images?: string[]
  status?: ListingStatus
}

export interface ListingSearchQuery {
  sellerId?: UUID
  category?: Category
  status?: ListingStatus
  minPriceAmount?: string
  maxPriceAmount?: string
  q?: string // keyword search (title/description/brand) - implemented in service layer
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc'
}
