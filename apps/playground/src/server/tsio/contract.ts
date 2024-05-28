import { defineContract } from '@tsio/core'
import { GroupSchema, MessageSchema, NewMessageSchema } from './schemas'
import { z } from 'zod'

const chatContract = defineContract({
  chat: {
    sendMessage: {
      type: 'action',
      input: NewMessageSchema,
      response: GroupSchema,
    },
    onMessageReceived: {
      type: 'listener',
      data: GroupSchema,
    },
    updateTypingState: {
      type: 'action',
      input: z.object({ chatId: z.string(), userId: z.string(), isTyping: z.boolean() }),
    },
    onUserIsTyping: {
      type: 'listener',
      data: z.object({ chatId: z.string(), nickname: z.string(), isTyping: z.boolean() }),
    },
  },
})

export { chatContract }
