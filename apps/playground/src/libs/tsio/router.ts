import { prisma } from '../prisma'
import { router } from './tsio'

const chatRouter = router.create(a => ({
  chat: {
    sendMessage: a.chat.sendMessage.handler(async ({ input, emitEventTo }) => {
      let group = await prisma.group.findFirst({
        where: {
          AND: [
            {
              users: {
                some: { userId: input.senderId },
              },
            },
            {
              users: {
                some: { userId: input.receiverId },
              },
            },
          ],
        },
      })

      if (!group) {
        group = await prisma.group.create({
          data: {
            users: {
              create: [
                {
                  user: {
                    connect: { id: input.senderId },
                  },
                },
                {
                  user: {
                    connect: { id: input.receiverId },
                  },
                },
              ],
            },
          },
        })
      }

      const message = await prisma.message.create({
        data: {
          text: input.text,
          receiverId: input.receiverId,
          senderId: input.senderId,
          groupId: group.id,
        },
        include: {
          sender: true,
          receiver: true,
        },
      })

      const newMessage = { ...message, group }

      if (newMessage.receiver.socketId) {
        emitEventTo('chat.onMessageReceived', newMessage.receiver.socketId, newMessage)
      }

      return { success: true, data: newMessage }
    }),
  },
}))

export { chatRouter }
