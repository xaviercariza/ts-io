import type { z } from 'zod'
import type { MessageSchema, UserSchema } from './libs/tsio/schemas'

import session from 'express-session'

declare module 'express-session' {
  interface SessionData {
    user: UserProfile | null
  }
}

declare module 'http' {
  interface IncomingMessage {
    session?: session.Session & Partial<session.SessionData>
  }
}

export type MessageType = z.infer<typeof MessageSchema>
export type UserProfile = z.infer<typeof UserSchema>
export type User = UserProfile & {
  groups: Group[]
}
export type ChatMessage = MessageType & {
  from: 'me' | 'other'
}

export type Message = {
  id: string
  text: string
  senderId: string
  receiverId: string
  sender: UserProfile
  receiver: UserProfile
  createdAt: Date
}
export type Chat = {
  key: string
  otherParticipant: UserProfile
  messages: Message[]
}

export type Group = {
  id: string
  messages: Message[]
  users: UserProfile[]
}

type ErrorResponse = { success: false; error: string; code: number }
type SuccessResponse<T> = { success: true; data: T }
export type Response<T> = SuccessResponse<T> | ErrorResponse
