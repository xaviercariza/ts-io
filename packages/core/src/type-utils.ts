/* eslint-disable @typescript-eslint/ban-types */
import { ZodType, z } from 'zod'
import {
  TActionWithAck,
  TBaseAction,
  IoAction,
  IoActions,
  IoListener,
  IoListeners,
  IoContract,
} from './types'

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

const getResponseUnionSchema = <Data extends ZodType>(data: Data) =>
  z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), data }),
    z.object({ success: z.literal(false), error: z.string() }),
  ])

const isBasicAction = (action: TBaseAction | TActionWithAck): action is TBaseAction => {
  return 'input' in action && !('response' in action)
}

const isIoActionWithAck = (action: TBaseAction | TActionWithAck): action is TActionWithAck => {
  return 'input' in action && 'response' in action
}

const isIoAction = (obj: IoActions | IoAction): obj is IoAction => {
  return 'input' in obj
}

const isIoListener = (obj: IoListeners | IoListener): obj is IoListener => {
  return 'data' in obj
}

type RecursivelyMergeContracts<Contracts extends IoContract[]> = Contracts extends [
  infer Head,
  ...infer Tail,
]
  ? Head extends IoContract
    ? Tail extends IoContract[]
      ? RecursivelyMergeContracts<Tail> & Head
      : never
    : never
  : {}

export { getResponseUnionSchema, isIoAction, isBasicAction, isIoActionWithAck, isIoListener }
export type { Prettify, AtLeastOne, RecursivelyMergeContracts }
