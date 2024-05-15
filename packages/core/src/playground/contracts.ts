import { z } from 'zod'
import { defineContract } from '../contract'

const PlayerSchema = z.object({
  id: z.string(),
  nickname: z.string(),
})
const searchContract = defineContract({
  search: {
    searchPlayer: {
      type: 'action',
      input: z.object({ search: z.string() }),
      response: PlayerSchema,
    },
  },
})

const RequestMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  message: z.string(),
})
const socialContract = defineContract({
  social: {
    router1: {
      router3: {
        sendFriendRequest: {
          type: 'action',
          input: RequestMessageSchema.omit({ id: true }),
        },
        declineFriendRequest: {
          type: 'action',
          input: RequestMessageSchema.pick({ id: true }),
        },
        onFriendRequestReceived: {
          type: 'listener',
          data: RequestMessageSchema,
        },
      },
    },
    router2: {
      router2Test: {
        type: 'listener',
        data: RequestMessageSchema,
      },
    },
  },
})

export { searchContract, socialContract }
