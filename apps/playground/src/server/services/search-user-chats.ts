import type { Response, UserProfile } from '../../types'
import { prisma } from '../prisma'

const searchUserChats = async (
  search: string,
  userNickname: string
): Promise<Response<UserProfile[]>> => {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          nickname: {
            contains: search,
          },
        },
        {
          nickname: {
            not: userNickname,
          },
        },
      ],
    },
    select: {
      id: true,
      nickname: true,
    },
  })

  return { success: true, data: users }
}

export { searchUserChats }
