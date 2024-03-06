import { TsIoServerAdapter } from '../adapter-types'
import { IoAction, IoContract, ParseSchema, TActionWithAck } from '../types'
import { createBuilder } from './action-builder'
import { createMiddlewareFactory } from './middleware'
import { createTsIoRouter, type Router } from './router'

type InferActionInput<Action extends IoAction> = Action['input']
type InferActionOutput<Action extends IoAction> = Action extends TActionWithAck
  ? Action['response']
  : undefined

function initTsIo<TInitialContext extends object, Contract extends IoContract>(
  context: TInitialContext,
  contract: Contract
) {
  return {
    middleware: createMiddlewareFactory<TInitialContext>(),
    action: <ActionKey extends keyof Contract['actions']>(actionKey: ActionKey) => {
      type BuilderDefinition = {
        listeners: Contract['listeners']
        ctx: TInitialContext
        input: InferActionInput<Contract['actions'][ActionKey]>
        output: InferActionOutput<Contract['actions'][ActionKey]>
      }

      return createBuilder<BuilderDefinition>({
        context,
        input: contract.actions[actionKey].input,
      })
    },
    router: createTsIoRouter(contract),
  }
}

const attachTsIoToWebSocket = <Contract extends IoContract>(
  router: Router<Contract>,
  adapter: TsIoServerAdapter<any>
) => {
  Object.keys(router).forEach(key => {
    const action = router[key]
    if (!action) {
      throw new Error(`Can not find ${key} action`)
    }

    adapter.on(key, async (input: ParseSchema<Contract['actions'][typeof key]['input']>) => {
      const actionResult = await action({
        path: key,
        input,
        emitTo: adapter.emitTo,
      })
      return actionResult as any
    })
  })
}

export { attachTsIoToWebSocket, initTsIo }
