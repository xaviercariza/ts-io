import { tsIo } from './tsio'

const router = tsIo.router.create(a => ({
  chat: {
    sendMessage: a.chat.sendMessage.handler(({ input, emitEventTo }) => {
      const newMessage = {
        id: new Date().getTime().toString(),
        message: input.message,
      }

      emitEventTo('chat.onMessageReceived', 'broadcast', newMessage)

      return { success: true, data: newMessage }
    }),
  },
}))

export { router }
