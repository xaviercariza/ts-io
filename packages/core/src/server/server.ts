import { TsIoServerAdapter } from '../adapter-types'
import { AnyContractRouter, Leaves, ValueAtPath, getContractActionsSchemaByPath } from '../contract'
import { IoAction, TActionWithAck } from '../types'
import { createBuilder } from './action-builder'
import { createMiddlewareFactory } from './middleware'
import { AnyRouter, createTsIoRouter, isRouterAction } from './router'

function initTsIo<TInitialContext extends object, Contract extends AnyContractRouter>(
  context: TInitialContext,
  contract: Contract
) {
  return {
    middleware: createMiddlewareFactory<TInitialContext>(),
    action: <ActionKey extends Leaves<Contract['actions']>>(actionKey: ActionKey) => {
      const schema = getContractActionsSchemaByPath(contract.actions, actionKey) as ValueAtPath<
        Contract,
        `actions.${ActionKey}`
      >
      type ActionSchema = typeof schema
      type BuilderDefinition = {
        contract: Contract
        ctx: TInitialContext
        input: ActionSchema extends IoAction ? ActionSchema['input'] : undefined
        output: ActionSchema extends TActionWithAck ? ActionSchema['response'] : undefined
      }

      return createBuilder<BuilderDefinition>({
        context,
        input: (schema as IoAction).input,
      })
    },
    router: createTsIoRouter(contract),
  }
}

const attachTsIoToWebSocket = <Router extends AnyRouter>(
  router: Router,
  adapter: TsIoServerAdapter<any>,
  path: string = 'actions'
) => {
  Object.keys(router).forEach(key => {
    const action = router[key]
    if (!action) {
      throw new Error(`Can not find ${key} action`)
    }

    if (!isRouterAction(action)) {
      return attachTsIoToWebSocket(action, adapter, `${path}.${key}`)
    }

    const actionPath = `${path}.${key}`

    adapter.on(actionPath, async input => {
      const actionResult = await action({
        path: actionPath,
        input,
        // @ts-expect-error TODO: FIX THIS
        emitTo: adapter.emitTo,
      })
      return actionResult as any
    })
  })
}

export { attachTsIoToWebSocket, initTsIo }
