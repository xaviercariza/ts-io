import { initTsIo } from '@tsio/core'
import type { UserProfile } from '../../types'
import { chatContract } from './contract'
import type { Socket } from 'socket.io'

type Context = { user: UserProfile | null; socket: Socket }

const tsIo = initTsIo.context<Context>().create(chatContract)
const router = tsIo.router
const middleware = tsIo.middleware
const attachRouterToSocket = tsIo.attachRouterToSocket

export { attachRouterToSocket, middleware, router }
