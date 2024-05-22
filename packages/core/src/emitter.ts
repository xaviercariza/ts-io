import { ValueAtPath } from './contract'
import { ContractListener, ContractPaths, ContractRouterType } from './contract'
import { ParseSchema } from './types'

type AnyEmitEventToFunction = EmitEventToFunction<any>

type EmitEventToFunction<Contract extends ContractRouterType> = <
  ListenerKey extends ContractPaths<Contract, 'listener'>,
>(
  listenerKey: ListenerKey,
  socketId: string,
  listenerSchema: ValueAtPath<Contract, ListenerKey> extends ContractListener
    ? ParseSchema<ValueAtPath<Contract, ListenerKey>['data']>
    : never
) => void

export type { AnyEmitEventToFunction, EmitEventToFunction }
