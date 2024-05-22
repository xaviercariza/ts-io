import { attachTsIoToWebSocket } from './adapter'
import { ContractRouterType } from './contract'
import { createMiddlewareFactory } from './middleware'
import { createRouterFactory } from './router'

class TsIoBuilder<TContext extends object> {
  context<TNewContext extends object>() {
    return new TsIoBuilder<TNewContext>()
  }
  create<TContract extends ContractRouterType>(contract: TContract) {
    return {
      router: createRouterFactory<TContract, TContext>(contract),
      middleware: createMiddlewareFactory<TContext>(),
      attachRouterToSocket: attachTsIoToWebSocket<TContext>,
    }
  }
}
const initTsIo = new TsIoBuilder()

export { initTsIo }

// import { attachTsIoToWebSocket } from './adapter'
// import { ContractRouterType } from './contract'
// import { createMiddlewareFactory } from './middleware'
// import { createRouterFactory } from './router'

// interface TsIo<TContract extends ContractRouterType, TContext extends object> {
//   router: ReturnType<typeof createRouterFactory<TContract, TContext>>
//   middleware: ReturnType<typeof createMiddlewareFactory<TContext>>
//   attachRouterToSocket: typeof attachTsIoToWebSocket
// }

// function initTsIo<TContract extends ContractRouterType, TContext extends object>(
//   contract: TContract,
//   context: TContext
// ): TsIo<TContract, TContext> {
//   return {
//     router: createRouterFactory(contract, context),
//     middleware: createMiddlewareFactory<TContext>(),
//     attachRouterToSocket: attachTsIoToWebSocket,
//   }
// }

// export  {initTsIo }
