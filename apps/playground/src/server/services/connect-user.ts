import { prisma } from '../../libs/prisma'

const connectUser = async (userId: string, socketId: string) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      socketId: socketId,
    },
  })
}

export { connectUser }
