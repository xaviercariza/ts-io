import { initTsIo } from '@tsio/core'
import type { UserProfile } from '../../types'
import { chatContract } from './contract'

type Context = { user: UserProfile | null }

const tsIo = initTsIo.context<Context>().create(chatContract)
const router = tsIo.router
const middleware = tsIo.middleware
const attachRouterToSocket = tsIo.attachRouterToSocket

export { attachRouterToSocket, middleware, router }
