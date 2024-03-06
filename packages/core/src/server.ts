import { z } from 'zod'
import { getResponseUnionSchema, isIoAction, isIoActionWithAck } from './type-utils'
import {
  IoAction,
  IoActions,
  IoContract,
  IoListeners,
  TActionWithAck,
  TBaseAction,
  TResponse,
} from './types'
import { Socket } from 'socket.io'

type TsIoContext = {
  userPlayerId: string
}

type EmitEventToFunction<Listeners extends IoListeners> = <ListenerKey extends keyof Listeners>(
  listenerKey: ListenerKey,
  socketId: string,
  listenerSchema: z.infer<Listeners[ListenerKey]['data']>
) => void

type HandlerArgs<Action extends IoAction, Listeners extends IoListeners> = {
  input: z.infer<Action['input']>
  ctx: TsIoContext
  emitEventTo: EmitEventToFunction<Listeners>
}

type ActionHandlerWithAck<Action extends TActionWithAck, Listeners extends IoListeners> = (
  args: HandlerArgs<Action, Listeners>
) => Promise<TResponse<z.infer<Action['response']>>> | TResponse<z.infer<Action['response']>>

type ActionHandler<Action extends TBaseAction, Listeners extends IoListeners> = (
  args: HandlerArgs<Action, Listeners>
) => Promise<void> | void

type ActionImplementation<Action extends IoAction, Listeners extends IoListeners> = {
  handler: Action extends TActionWithAck
    ? ActionHandlerWithAck<Action, Listeners>
    : Action extends TBaseAction
      ? ActionHandler<Action, Listeners>
      : never
}

type RecursiveActionsObj<T extends IoActions | IoAction, Listeners extends IoListeners> = {
  [TKey in keyof T]: T[TKey] extends IoActions
    ? RecursiveActionsObj<T[TKey], Listeners>
    : T[TKey] extends IoAction
      ? ActionImplementation<T[TKey], Listeners>
      : never
}

type InferServerActions<Contract extends IoContract> = Contract['actions'] extends IoActions
  ? RecursiveActionsObj<
      Contract['actions'],
      Contract['listeners'] extends IoListeners ? Contract['listeners'] : never
    >
  : never

const recursivelyApplySocketEvents = <Listeners extends IoListeners>({
  event,
  schema,
  router,
  processRoute,
}: {
  event: keyof IoActions | null
  schema: IoActions | IoAction
  router: RecursiveActionsObj<any, Listeners> | ActionImplementation<any, Listeners>
  processRoute: (
    event: keyof IoActions,
    implementation: ActionImplementation<IoAction, Listeners>,
    schema: IoAction
  ) => void
}): void => {
  if (typeof router === 'object' && typeof router?.handler !== 'function') {
    for (const key in router) {
      if (isIoAction(schema)) {
        throw new Error(`[ts-io] Expected AppRouter but received AppRoute`)
      }

      recursivelyApplySocketEvents({
        event: key,
        schema: schema[key],
        router: (router as RecursiveActionsObj<any, Listeners>)[key],
        processRoute,
      })
    }
  } else if (typeof router === 'function' || typeof router?.handler === 'function') {
    if (!isIoAction(schema)) {
      throw new Error(`[ts-io] Expected AppRoute but received AppRouter`)
    }

    if (!event) {
      throw new Error(`[ts-io] Expected event to be defined`)
    }

    processRoute(event, router as ActionImplementation<IoAction, Listeners>, schema)
  }
}

const validateInputData = <Action extends TBaseAction>(
  input: Action['input'],
  contract: Action
) => {
  const parsedInput = contract.input.safeParse(input)
  if (!parsedInput.success) {
    throw new Error('Invalid input payload')
  }
  return parsedInput
}

const emitEventTo =
  <Listeners extends IoListeners>(socket: Socket): EmitEventToFunction<Listeners> =>
  (event, socketId, data) => {
    socket.to(socketId).emit(event as any, data)
  }

const DEFAULT_ACTION_OPTIONS: IoAction['options'] = {
  validate: true,
}

const applySocketBasicEvent =
  <Action extends TBaseAction>(
    socket: Socket,
    contract: Action,
    implementation: ActionImplementation<Action, any>,
    ctx: TsIoContext
  ) =>
  async (input: z.infer<typeof contract.input>) => {
    const { options = DEFAULT_ACTION_OPTIONS } = contract

    if (options.validate) {
      const validatedInput = validateInputData(input, contract)
      return await implementation.handler({
        input: validatedInput.data,
        ctx,
        emitEventTo: emitEventTo(socket),
      })
    }
  }

const applySocketEventWithAck =
  <Action extends TActionWithAck, Listeners extends IoListeners>(
    socket: Socket,
    contract: Action,
    impl: ActionImplementation<Action, Listeners>,
    ctx: TsIoContext
  ) =>
  async (
    input: z.infer<typeof contract.input>,
    callback: (output: TResponse<z.infer<typeof contract.response>>) => void
  ) => {
    const { options = DEFAULT_ACTION_OPTIONS } = contract
    if (options.validate) {
      const validatedInput = validateInputData(input, contract)

      const response = await impl.handler({
        input: validatedInput.data,
        ctx,
        emitEventTo: emitEventTo(socket),
      })

      if (!response) {
        throw new Error('Action with a response defined in contract must return a value')
      }

      const ResponseUnionSchema = getResponseUnionSchema(contract.response)
      const parsedResponse = ResponseUnionSchema.safeParse(response)
      if (!parsedResponse.success) {
        throw new Error(`Response does not match ${event}'s contract response schema`)
      }

      callback(response)
    }
  }

const applySocketActions = <Contract extends IoContract>(
  schema: Contract,
  actions: InferServerActions<Contract>,
  socket: Socket
) => {
  recursivelyApplySocketEvents({
    event: null,
    schema: schema.actions,
    router: actions,
    processRoute: (event, implementation, schema) => {
      const ctx = (implementation as any).ctx

      if (isIoActionWithAck(schema)) {
        const impl = implementation

        return socket.on(
          event as any,
          applySocketEventWithAck(
            socket,
            schema,
            impl as ActionImplementation<TActionWithAck, IoListeners>,
            ctx
          )
        )
      }

      return socket.on(
        event as any,
        applySocketBasicEvent(
          socket,
          schema,
          implementation as ActionImplementation<TBaseAction, IoListeners>,
          ctx
        )
      )
    },
  })
}

const initServer = (context?: TsIoContext) => {
  return {
    actions: <Contract extends IoContract>(
      _schema: Contract,
      def: InferServerActions<Contract>
    ): InferServerActions<Contract> => {
      const actionsWithContext: any = {}
      for (const actionName in def) {
        const actionDefinition = def[actionName]
        actionsWithContext[actionName] = {
          handler: actionDefinition.handler,
          ctx: context ?? {},
        }
      }
      return actionsWithContext
    },
  }
}

export type { InferServerActions, TsIoContext }
export { initServer, applySocketActions }
