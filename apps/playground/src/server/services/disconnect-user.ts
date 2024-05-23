import { prisma } from '../prisma'

const disconnectUser = async (userId: string) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      socketId: null,
    },
  })
}

export { disconnectUser }
