import { AnyContractRouter } from '../contract'
import { IoAction, IoActions, IoContract, ParseSchema, TActionWithAck, UnsetMarker } from '../types'
import { Action, AnyAction } from './action'

type AnyRouter = Router<any, any, any>
type Router<
  // @TODO: FIX THIS, WE SHOULD NOT NEED TO PASS ALL THREE GENERICS
  Contract extends IoContract,
  Actions extends Contract['actions'],
  Listeners extends Contract['listeners'],
> = {
  [K in keyof Actions]: Actions[K] extends IoActions
    ? Router<Contract, Actions[K], Listeners>
    : Actions[K] extends { [key: string]: AnyContractRouter['actions'] }
      ? Router<Contract, Actions[K], Listeners>
      : Actions[K] extends IoAction
        ? Action<
            Contract,
            ParseSchema<Actions[K]['input']>,
            Actions[K] extends TActionWithAck ? ParseSchema<Actions[K]['response']> : UnsetMarker
          >
        : never
}

const isRouterAction = (action: AnyRouter | AnyAction): action is AnyAction => {
  return typeof action === 'function'
}

const createTsIoRouter = <Contract extends AnyContractRouter>(_contract: Contract) => {
  return (
    actions: Router<Contract, Contract['actions'], Contract['listeners']>
  ): Router<Contract, Contract['actions'], Contract['listeners']> => actions
}

export { createTsIoRouter, isRouterAction }
export type { AnyRouter, Router }
