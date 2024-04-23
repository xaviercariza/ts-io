import { z } from 'zod'
import { TsIoClientAdapter } from './adapter-types'
import { isContractAction, isContractListener } from './contract'
import { isBasicAction, isIoActionWithAck, isIoListener } from './type-utils'
import {
  IoAction,
  IoActions,
  IoContract,
  IoListener,
  IoListeners,
  TActionWithAck,
  TBaseAction,
  TResponse,
} from './types'

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

const toClientProxy = (
  events: [string, IoAction | IoListener],
  splitWith: string = '.'
): TsIoClient<IoContract> => {
  const result = {}

  Object.entries(events).forEach(([path, action]) => {
    const pathParts = path.split(splitWith)
    let currentRouter: Record<string, any> | undefined = result

    for (let i = 0; i < pathParts.length; i++) {
      const pathKey = pathParts[i]
      if (!pathKey) {
        throw new Error('Error building client actions')
      }
      if (!currentRouter![pathKey]) {
        if (i === pathParts.length - 1) {
          currentRouter![pathKey] = action
        } else {
          currentRouter![pathKey] = {}
        }
      }
      currentRouter = currentRouter![pathKey] as Record<string, any>
    }
  })

  return result as TsIoClient<IoContract>['actions']
}

const initNewClient = <Router extends IoContract, Adapter extends TsIoClientAdapter<IoContract>>(
  adapter: Adapter,
  router: Router
): TsIoClient<Router> => {
  function getActions(
    contract: IoContract,
    adapter: TsIoClientAdapter<IoContract>,
    path: string = 'actions'
  ): [string, IoAction] {
    return Object.fromEntries(
      Object.entries(contract.actions).map(([key, action]) => {
        const actionPath = `${path}.${key}`

        if (!isContractAction(action)) {
          return getActions(action, adapter, actionPath)
        }

        if (isIoActionWithAck(action)) {
          return [actionPath, getActionWithAck(adapter, actionPath)]
        } else if (isBasicAction(action)) {
          return [actionPath, getBasicAction(adapter, actionPath)]
        } else {
          return [actionPath, initNewClient(adapter, action)]
        }
      })
    )
  }
  function getListeners(
    contract: IoContract,
    adapter: TsIoClientAdapter<IoContract>,
    path: string = 'listeners'
  ): [string, IoListener] {
    return Object.fromEntries(
      Object.entries(contract.listeners).map(([key, listener]) => {
        const listenerPath = `${path}.${key}`

        if (!isContractListener(listener)) {
          return getListeners(listener, adapter, listenerPath)
        }

        if (isIoListener(listener)) {
          return [listenerPath, getListener(adapter, listenerPath)]
        } else {
          return [listenerPath, initNewClient(adapter, listener)]
        }
      })
    )
  }

  return {
    ...toClientProxy(getActions(router, adapter)),
    ...toClientProxy(getListeners(router, adapter)),
  }
}

export { initNewClient }
export type { TsIoClient }
