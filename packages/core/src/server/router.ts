import { IoContract, ParseSchema, TActionWithAck, UnsetMarker } from '../types'
import { Action } from './action'

export type Router<Contract extends IoContract> = {
  [K in keyof Contract['actions']]: Action<
    Contract['listeners'],
    ParseSchema<Contract['actions'][K]['input']>,
    Contract['actions'][K] extends TActionWithAck
      ? ParseSchema<Contract['actions'][K]['response']>
      : UnsetMarker
  >
}

export const createTsIoRouter = <Contract extends IoContract>(_contract: Contract) => {
  return (actions: Router<Contract>): Router<Contract> => actions
}
