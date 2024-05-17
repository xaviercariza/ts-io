import { Action } from './action'
import { ActionBuilder, createBuilder } from './builder'
import {
  ContractAction,
  ContractPaths,
  ContractRouterType,
  TActionWithAck,
  isContractListener,
  isContractRouter,
} from './contract'
import { ParseSchema, UnsetMarker } from './types'

type AnyRouter = Router<any, any>
type Router<Contract extends ContractRouterType, RootContract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractAction | ContractRouterType
    ? K
    : never]: Contract[K] extends ContractRouterType
    ? Router<Contract[K], RootContract>
    : Contract[K] extends ContractAction
      ? Action<
          RootContract,
          ParseSchema<Contract[K]['input']>,
          Contract[K] extends TActionWithAck ? ParseSchema<Contract[K]['response']> : UnsetMarker
        >
      : never
}

type RouterActionsBuilder<
  Contract extends ContractRouterType,
  TInitialContext,
  RootContract extends ContractRouterType,
> = {
  [K in keyof Contract as K extends ContractPaths<Contract, 'listener'>
    ? never
    : K]: Contract[K] extends ContractRouterType
    ? RouterActionsBuilder<Contract[K], TInitialContext, RootContract>
    : Contract[K] extends ContractAction
      ? ActionBuilder<
          RootContract,
          TInitialContext,
          TInitialContext,
          ParseSchema<Contract[K]['input']>,
          Contract[K] extends TActionWithAck ? ParseSchema<Contract[K]['response']> : UnsetMarker
        >
      : never
}

type AnyRouterCreator = RouterCreator<any, any, any>
interface RouterCreator<
  TContract extends ContractRouterType,
  TContext extends object,
  RootContract extends ContractRouterType,
> {
  create(
    createActions: (
      actions: RouterActionsBuilder<TContract, TContext, RootContract>
    ) => Router<TContract, RootContract>
  ): Router<TContract, RootContract>
  create(router: Router<TContract, RootContract>): Router<TContract, RootContract>
}

type Routers<
  T extends ContractRouterType,
  TContext extends object,
  RootContract extends ContractRouterType,
> = RouterCreator<T, TContext, RootContract> & {
  [K in keyof T]: T[K] extends ContractRouterType
    ? Routers<T[K], TContext, RootContract>
    : T[K] extends ContractRouterType
      ? RouterCreator<T[K], TContext, RootContract>
      : never
}

const createContractActions = <
  TContract extends ContractRouterType,
  TContext extends object,
  RootContract extends ContractRouterType,
>(
  contract: TContract,
  context: TContext
): RouterActionsBuilder<TContract, TContext, RootContract> => {
  return Object.entries(contract).reduce((acc, [key, subRouter]) => {
    if (isContractRouter(subRouter)) {
      return { ...acc, [key]: createContractActions(subRouter, context) }
    }

    if (isContractListener(subRouter)) {
      return acc
    }

    type ActionSchema = typeof subRouter
    type TActionBuilder = ActionBuilder<
      TContract,
      TContext,
      any,
      ActionSchema extends ContractAction ? ActionSchema['input'] : undefined,
      ActionSchema extends TActionWithAck ? ActionSchema['response'] : undefined
    >
    return {
      ...acc,
      [key]: createBuilder({
        context,
        input: subRouter.input,
      }) as TActionBuilder,
    }
  }, {}) as RouterActionsBuilder<TContract, TContext, RootContract>
}

const getRouterCreator = <TContract extends ContractRouterType, TContext extends object>(
  router: TContract,
  context: TContext
): RouterCreator<TContract, TContext, TContract> => {
  return {
    create: createActions => {
      if (typeof createActions === 'function') {
        return createActions(createContractActions(router, context))
      }

      return createActions
    },
  }
}

const RESTRICTED_ROUTER_NAMES: string[] = []
function extractRouters<TContract extends ContractRouterType, TContext extends object>(
  contract: TContract,
  context: TContext
): Routers<TContract, TContext, TContract> {
  const routers: Record<string, AnyRouterCreator> = {}

  function traverse(node: ContractRouterType) {
    for (const key in node) {
      const subRouter = node[key]
      if (typeof subRouter === 'object' && subRouter !== null) {
        if (isContractRouter(subRouter)) {
          if (RESTRICTED_ROUTER_NAMES.includes(key)) {
            throw new Error(`Router name "${key}" is restricted and cannot be used.`)
          }
          routers[key] = getRouterCreator(subRouter, context)
          traverse(subRouter as ContractRouterType)
        }
      }
    }
  }

  traverse(contract)

  return routers as Routers<TContract, TContext, TContract>
}

function createRouterFactory<TContract extends ContractRouterType, TContext extends object>(
  contract: TContract,
  context: TContext
): Routers<TContract, TContext, TContract> {
  return { ...getRouterCreator(contract, context), ...extractRouters(contract, context) }
}

export type { RouterCreator, Router, AnyRouter }
export { createRouterFactory }
