import { defineContract } from '@tsio/core'
import { MessageSchema, NewMessageSchema } from './schemas'

const chatContract = defineContract({
  chat: {
    sendMessage: {
      type: 'action',
      input: NewMessageSchema,
      response: MessageSchema,
    },
    onMessageReceived: {
      type: 'listener',
      data: MessageSchema,
    },
  },
})

export { chatContract }
