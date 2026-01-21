import type { UUID, ISODateString } from './common'
import type { UserRole } from './enums'

export interface User {
  id: UUID
  email: string
  role: UserRole

  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null

  stripeAccountId?: string | null

  createdAt?: ISODateString
  updatedAt?: ISODateString
}

export interface CreateUserInput {
  email: string
  password: string
  username?: string
  displayName?: string
}

export interface UpdateUserInput {
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}
