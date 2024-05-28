import { prisma } from '../prisma'
import type { Response, UserProfile } from '../../types'

const getAllUser = async (filterByNickname?: string): Promise<Response<UserProfile[]>> => {
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        nickname: filterByNickname,
      },
    },
  })

  return { success: true, data: users }
}

export { getAllUser }
