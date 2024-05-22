import { prisma } from '../../libs/prisma'
import type { Group, Response } from '../../types'

const getChats = async (userId: string): Promise<Response<Group[] | null>> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      groups: {
        include: {
          group: {
            include: {
              messages: {
                include: {
                  receiver: true,
                  sender: true,
                },
              },
              users: {
                select: {
                  user: {
                    select: {
                      id: true,
                      nickname: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    return { success: false, error: 'User not found', code: 404 }
  }

  const userGroups: Group[] = user.groups.map(g => ({
    ...g.group,
    messages: g.group.messages.map(m => ({
      ...m,
      receiver: {
        id: m.receiver.id,
        nickname: m.receiver.nickname,
      },
      sender: {
        id: m.sender.id,
        nickname: m.sender.nickname,
      },
    })),
    users: g.group.users.map(u => ({ id: u.user.id, nickname: u.user.nickname })),
  }))

  return { success: true, data: userGroups }
}

export { getChats }
