import type { UUID, ISODateString } from './common'
import type { NotificationType } from './enums'

export interface Notification {
  id: UUID
  userId: UUID

  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown> | null

  read: boolean
  readAt?: ISODateString | null

  createdAt: ISODateString
}

export interface MarkNotificationReadInput {
  read: boolean
}
