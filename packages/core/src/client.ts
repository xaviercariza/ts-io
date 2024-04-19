import { z } from 'zod'
import { TsIoClientAdapter } from './adapter-types'
import {
  IoActions,
  IoContract,
  IoListener,
  IoListeners,
  TActionWithAck,
  TBaseAction,
  TResponse,
} from './types'
import { isBasicAction, isIoActionWithAck, isIoListener } from './type-utils'

type BasicAction<Action extends TBaseAction> = (
  body: z.infer<Action['input']>
) => Promise<void> | void

type ActionWithAck<Action extends TActionWithAck> = (
  body: z.infer<Action['input']>
) => Promise<TResponse<z.infer<Action['response']>>> | TResponse<z.infer<Action['response']>>

type ListenerFunction<Listener extends IoListener> = (
  callback: (response: z.infer<Listener['data']>) => void
) => void

type RecursiveActionsProxyObj<Actions extends IoActions> = {
  [Key in keyof Actions]: Actions[Key] extends IoActions
    ? RecursiveActionsProxyObj<Actions[Key]>
    : Actions[Key] extends TActionWithAck
      ? ActionWithAck<Actions[Key]>
      : BasicAction<Actions[Key]>
}

type RecursiveListenersProxyObj<Listeners extends IoListeners> = {
  [ListenerKey in keyof Listeners]: Listeners[ListenerKey] extends IoListener
    ? ListenerFunction<Listeners[ListenerKey]>
    : Listeners[ListenerKey] extends IoListeners
      ? RecursiveListenersProxyObj<Listeners[ListenerKey]>
      : never
}

const getBasicAction =
  <TAction extends TBaseAction, Adapter extends TsIoClientAdapter<any>>(
    adapter: Adapter,
    actionKey: keyof IoActions
  ): BasicAction<TAction> =>
  body => {
    adapter.emit(actionKey as any, body)
  }
const getActionWithAck =
  <TAction extends TActionWithAck, Adapter extends TsIoClientAdapter<any>>(
    adapter: Adapter,
    actionKey: keyof IoActions
  ): ActionWithAck<TAction> =>
  body => {
    return new Promise<TResponse<z.infer<TAction['response']>>>(resolve => {
      adapter.emit(actionKey as any, body, resolve)
    })
  }

const getListener = <Listener extends IoListener, Adapter extends TsIoClientAdapter<any>>(
  adapter: Adapter,
  listenerKey: keyof IoListeners
): ListenerFunction<Listener> => {
  return callback => {
    adapter.on(listenerKey as any, callback)
  }
}

type TsIoClient<Contract extends IoContract> = {
  actions: Contract['actions'] extends IoActions
    ? RecursiveActionsProxyObj<Contract['actions']>
    : never
  listeners: Contract['listeners'] extends IoListeners
    ? RecursiveListenersProxyObj<Contract['listeners']>
    : never
}

const initNewClient = <Contract extends IoContract, Adapter extends TsIoClientAdapter<IoContract>>(
  adapter: Adapter,
  contract: Contract
): TsIoClient<Contract> => {
  return {
    actions:
      contract.actions &&
      Object.fromEntries(
        Object.entries(contract.actions).map(([key, subContract]) => {
          const actionKey = key as keyof IoActions
          if (isIoActionWithAck(subContract)) {
            return [key, getActionWithAck(adapter, actionKey)]
          } else if (isBasicAction(subContract)) {
            return [key, getBasicAction(adapter, actionKey)]
          } else {
            return [key, initNewClient(adapter, subContract)]
          }
        })
      ),
    listeners:
      contract.listeners &&
      Object.fromEntries(
        Object.entries(contract.listeners).map(([key, subListener]) => {
          if (isIoListener(subListener)) {
            const listenerKey = key as keyof IoListeners
            return [key, getListener(adapter, listenerKey)]
          } else {
            return [key, initNewClient(adapter, subListener)]
          }
        })
      ),
  }
}

export type { TsIoClient }
export { initNewClient }
