import { prisma } from '../prisma'
import type { Response, UserProfile } from '../../types'

const getUser = async (nickname: string): Promise<Response<UserProfile | null>> => {
  const user = await prisma.user.findUnique({
    where: {
      nickname,
    },
    select: {
      id: true,
      nickname: true,
    },
  })

  if (!user) {
    return { success: false, error: 'User not found', code: 404 }
  }

  return { success: true, data: user }
}

export { getUser }
