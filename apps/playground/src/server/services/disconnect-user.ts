import { prisma } from '../../libs/prisma'

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
