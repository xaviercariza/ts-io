import { prisma } from '../../libs/prisma'
import type { Response, UserProfile } from '../../types'

const searchUserChats = async (
  userId: string,
  search: string
): Promise<Response<UserProfile[]>> => {
  const users = await prisma.user.findMany({
    where: {
      nickname: {
        contains: search,
      },
    },
    // include: {
    //   groups: {
    //     include: {
    //       group: {
    //         include: {
    //           messages: {
    //             include: {
    //               receiver: true,
    //               sender: true,
    //             },
    //           },
    //           users: {
    //             select: {
    //               user: {
    //                 select: {
    //                   id: true,
    //                   nickname: true,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const normalizerUsers: UserProfile[] = users.map(({ password, ...user }) => user)

  return { success: true, data: normalizerUsers }

  // const chats: Record<string, Chat> = {}
  // for (const user of usersFound) {
  //   const messages = await prisma.message.findMany({
  //     where: {
  //       OR: [{ receiverId: user.id }, { senderId: user.id }],
  //     },
  //     include: {
  //       receiver: true,
  //       sender: true,
  //     },
  //   })

  //   messages.forEach(message => {
  //     const key = getChatKey(message.senderId, message.receiverId)
  //     const otherUser = message.senderId === userId ? message.receiver : message.sender
  //     if (!chats[key]) {
  //       chats[key] = {
  //         key,
  //         otherParticipant: otherUser,
  //         messages: [],
  //       }
  //     }

  //     chats[key]?.messages.push(message)
  //   })
  // }

  // return { success: true, data: Object.values(chats) }
}

export { searchUserChats }
