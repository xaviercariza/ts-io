import { initTsIo } from '@tsio/core'
import type { UserProfile } from '../../types'
import { chatContract } from './contract'

type Context = { user: UserProfile | null }

const tsIo = initTsIo.context<Context>().create(chatContract)
const router = tsIo.router
const middleware = tsIo.middleware
const attachRouterToSocket = tsIo.attachRouterToSocket

export { attachRouterToSocket, middleware, router }

// import { initTsIo } from '@tsio/core'
// import type { User } from '../../types'
// import type { Context } from './context'
// import { chatContract } from './contract'

// const initializeTsIo = (user: User | null) => {
//   const tsIo = initTsIo.context<Context>().create(chatContract, { user })
//   tsIo.router.chat.create(a => ({
//     sendMessage: a.sendMessage
//       .use(opts => {
//         if (!opts.ctx.user) {
//           throw new Error('Unauthorized!')
//         }
//         return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } })
//       })
//       .handler(({ input, ctx, emitEventTo }) => {
//         const newMessage = {
//           id: new Date().getTime().toString(),
//           message: input.message,
//         }

//         emitEventTo('chat.onMessageReceived', 'broadcast', newMessage)

//         return { success: true, data: newMessage }
//       }),
//   }))
//   return tsIo
// }

// export { initializeTsIo }
