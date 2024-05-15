import { attachTsIoToWebSocket } from './adapter'
import { ContractRouterType } from './contract'
import { createMiddlewareFactory } from './middleware'
import { createRouterFactory } from './router'

function initTsIo<TContract extends ContractRouterType, TContext extends object>(
  contract: TContract,
  context: TContext
) {
  return {
    router: createRouterFactory(contract, context),
    middleware: createMiddlewareFactory<TContext>(),
    attachRouterToSocket: attachTsIoToWebSocket,
  }
}

export { initTsIo }
