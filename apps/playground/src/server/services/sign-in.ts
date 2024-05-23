import bcrypt from 'bcrypt'
import { prisma } from '../prisma'
import type { Response, UserProfile } from '../../types'

const signIn = async (nickname: string, password: string): Promise<Response<UserProfile>> => {
  return await prisma.$transaction(async tx => {
    const existingUser = await tx.user.findUnique({
      where: {
        nickname,
      },
    })

    const hashedPassword = await bcrypt.hash(password, 12)

    if (existingUser) {
      const isValidPassword = bcrypt.compareSync(password, hashedPassword)
      if (isValidPassword) {
        return {
          success: true,
          data: existingUser,
        }
      }

      return { success: false, error: 'User already taken', code: 409 }
    }

    const user = await tx.user.create({
      data: {
        nickname,
        password: hashedPassword,
      },
    })

    return {
      success: true,
      data: user,
    }
  })
}

export { signIn }
