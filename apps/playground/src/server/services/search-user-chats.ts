import { prisma } from '../../libs/prisma'
import type { Response, UserProfile } from '../../types'

const searchUserChats = async (search: string): Promise<Response<UserProfile[]>> => {
  const users = await prisma.user.findMany({
    where: {
      nickname: {
        contains: search,
      },
    },
    select: {
      id: true,
      nickname: true,
    },
  })

  return { success: true, data: users }
}

export { searchUserChats }
