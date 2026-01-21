import type { UUID, ISODateString } from './common'

export interface Conversation {
  id: UUID
  user1Id: UUID
  user2Id: UUID
  lastMessageAt?: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface Message {
  id: UUID
  conversationId: UUID
  senderId: UUID
  text?: string | null
  imageUrl?: string | null
  createdAt?: ISODateString
}

export interface CreateConversationInput {
  otherUserId: UUID
}

export interface SendMessageInput {
  conversationId: UUID
  text?: string
  imageUrl?: string
}
