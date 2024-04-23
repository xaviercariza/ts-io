import { ListenerPaths, ValueAtPath } from '../contract'
import { IoContract, IoListener, ParseSchema } from '../types'

type AnyEmitEventToFunction = EmitEventToFunction<any>

// export type EmitEventToFunction<Listeners extends AnyContractRouter['listeners']> = <
//   ListenerKey extends Leaves<Listeners>,
// >(
//   listenerKey: ListenerKey,
//   socketId: string,
//   listenerSchema: ValueAtPath<Listeners, ListenerKey> extends IoListener
//     ? ParseSchema<ValueAtPath<Listeners, ListenerKey>['data']>
//     : never
//   // listenerSchema: Listeners extends IoListeners
//   //   ? ListenerKey extends keyof Listeners
//   //     ? ParseSchema<Listeners[ListenerKey]['data']>
//   //     : never
//   //   : never
// ) => void
export type EmitEventToFunction<Contract extends IoContract> = <
  ListenerKey extends ListenerPaths<Contract>,
>(
  listenerKey: ListenerKey,
  socketId: string,
  listenerSchema: ValueAtPath<Contract, ListenerKey> extends IoListener
    ? ParseSchema<ValueAtPath<Contract, ListenerKey>['data']>
    : never
  // listenerSchema: Listeners extends IoListeners
  //   ? ListenerKey extends keyof Listeners
  //     ? ParseSchema<Listeners[ListenerKey]['data']>
  //     : never
  //   : never
) => void

export type { AnyEmitEventToFunction }
