import { Socket } from 'socket.io-client'
import { z } from 'zod'
import { Prettify, isBasicAction, isIoActionWithAck, isIoListener } from './type-utils'
import {
  IoActions,
  IoContract,
  IoListener,
  IoListeners,
  TActionWithAck,
  TBaseAction,
  TResponse,
} from './types'

type ClientSocket = Socket

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

type IoClient<Contract extends IoContract> = {
  actions: Contract['actions'] extends IoActions
    ? RecursiveActionsProxyObj<Contract['actions']>
    : never
  listeners: Contract['listeners'] extends IoListeners
    ? RecursiveListenersProxyObj<Contract['listeners']>
    : never
}

const getBasicAction =
  <TAction extends TBaseAction>(
    socket: ClientSocket,
    actionKey: keyof IoActions
  ): BasicAction<TAction> =>
  body => {
    socket.emit(actionKey as any, body)
  }
const getActionWithAck =
  <TAction extends TActionWithAck>(
    socket: ClientSocket,
    actionKey: keyof IoActions
  ): ActionWithAck<TAction> =>
  body => {
    return new Promise<TResponse<z.infer<TAction['response']>>>(resolve => {
      socket.emit(actionKey as any, body, resolve)
    })
  }

const getListener = <Listener extends IoListener>(
  socket: ClientSocket,
  listenerKey: keyof IoListeners
): ListenerFunction<Listener> => {
  return callback => {
    socket.on(listenerKey as any, callback)
  }
}

const initClient = <Contract extends IoContract>(
  socket: ClientSocket,
  contract: Contract
): Prettify<IoClient<Contract>> => {
  return {
    actions:
      contract.actions &&
      Object.fromEntries(
        Object.entries(contract.actions).map(([key, subContract]) => {
          const actionKey = key as keyof IoActions
          if (isIoActionWithAck(subContract)) {
            return [key, getActionWithAck<typeof subContract>(socket, actionKey)]
          } else if (isBasicAction(subContract)) {
            return [key, getBasicAction<typeof subContract>(socket, actionKey)]
          } else {
            return [key, initClient(socket, subContract)]
          }
        })
      ),
    listeners:
      contract.listeners &&
      Object.fromEntries(
        Object.entries(contract.listeners).map(([key, subListener]) => {
          if (isIoListener(subListener)) {
            const listenerKey = key as keyof IoListeners

            return [key, getListener<typeof subListener>(socket, listenerKey)]
          } else {
            return [key, initClient(socket, subListener)]
          }
        })
      ),
  }
}

export { initClient }
export type { ClientSocket, IoClient, BasicAction, ActionWithAck, ListenerFunction }

// import { Socket } from "socket.io-client";
// import { z } from "zod";
// import {
//   Prettify,
//   isBasicAction,
//   isIoActionWithAck,
//   isIoListener,
// } from "./type-utils";
// import {
//   IoActions,
//   IoContract,
//   IoListener,
//   IoListeners,
//   TActionWithAck,
//   TBaseAction,
//   TResponse,
// } from "./types";

// type ClientSocket = Socket;

// type BasicAction<Action extends TBaseAction> = (
//   body: z.infer<Action["input"]>
// ) => Promise<void> | void;

// type ActionWithAck<Action extends TActionWithAck> = (
//   body: z.infer<Action["input"]>,
//   callback: (response: TResponse<z.infer<Action["response"]>>) => void
// ) => Promise<void> | void;

// type ListenerFunction<Listener extends IoListener> = (
//   callback: (response: z.infer<Listener["data"]>) => void
// ) => void;

// type RecursiveActionsProxyObj<Actions extends IoActions> = {
//   [Key in keyof Actions]: Actions[Key] extends IoActions
//     ? RecursiveActionsProxyObj<Actions[Key]>
//     : Actions[Key] extends TActionWithAck
//     ? ActionWithAck<Actions[Key]>
//     : BasicAction<Actions[Key]>;
// };

// type RecursiveListenersProxyObj<Listeners extends IoListeners> = {
//   [ListenerKey in keyof Listeners]: Listeners[ListenerKey] extends IoListener
//     ? ListenerFunction<Listeners[ListenerKey]>
//     : Listeners[ListenerKey] extends IoListeners
//     ? RecursiveListenersProxyObj<Listeners[ListenerKey]>
//     : never;
// };

// type IoClient<Contract extends IoContract> = {
//   actions: Contract["actions"] extends IoActions
//     ? RecursiveActionsProxyObj<Contract["actions"]>
//     : never;
//   listeners: Contract["listeners"] extends IoListeners
//     ? RecursiveListenersProxyObj<Contract["listeners"]>
//     : never;
// };

// const getBasicAction =
//   <TAction extends TBaseAction>(
//     socket: ClientSocket,
//     actionKey: keyof IoActions
//   ): BasicAction<TAction> =>
//   (body) => {
//     socket.emit(actionKey as any, body);
//   };
// const getActionWithAck =
//   <TAction extends TActionWithAck>(
//     socket: ClientSocket,
//     actionKey: keyof IoActions
//   ): ActionWithAck<TAction> =>
//   (body, callback) => {
//     socket.emit(actionKey as any, body, callback);
//   };

// const getListener = <Listener extends IoListener>(
//   socket: ClientSocket,
//   listenerKey: keyof IoListeners
// ): ListenerFunction<Listener> => {
//   return (callback) => {
//     socket.on(listenerKey as any, callback);
//   };
// };

// const initClient = <Contract extends IoContract>(
//   socket: ClientSocket,
//   contract: Contract
// ): Prettify<IoClient<Contract>> => {
//   return {
//     actions:
//       contract.actions &&
//       Object.fromEntries(
//         Object.entries(contract.actions).map(([key, subContract]) => {
//           const actionKey = key as keyof IoActions;
//           if (isIoActionWithAck(subContract)) {
//             return [
//               key,
//               getActionWithAck<typeof subContract>(socket, actionKey),
//             ];
//           } else if (isBasicAction(subContract)) {
//             return [key, getBasicAction<typeof subContract>(socket, actionKey)];
//           } else {
//             return [key, initClient(socket, subContract)];
//           }
//         })
//       ),
//     listeners:
//       contract.listeners &&
//       Object.fromEntries(
//         Object.entries(contract.listeners).map(([key, subListener]) => {
//           if (isIoListener(subListener)) {
//             const listenerKey = key as keyof IoListeners;
//             return [key, getListener<typeof subListener>(socket, listenerKey)];
//           } else {
//             return [key, initClient(socket, subListener)];
//           }
//         })
//       ),
//   };
// };

// export { initClient };
// export type { ClientSocket, IoClient, BasicAction, ActionWithAck };
