import { defineContract } from '@tsio/core'
import { z } from 'zod'

const MessageSchema = z.object({
  id: z.string(),
  message: z.string(),
})

type MessageType = z.infer<typeof MessageSchema>

const chatContract = defineContract({
  chat: {
    sendMessage: {
      type: 'action',
      input: MessageSchema.omit({ id: true }),
      response: MessageSchema,
    },
    onMessageReceived: {
      type: 'listener',
      data: MessageSchema,
    },
  },
})

export type { MessageType }
export { chatContract }
