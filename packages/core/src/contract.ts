import { IoAction, IoActions, IoContract, IoListener, IoListeners } from './types'

type ContractActions = IoActions | { [key: string]: ContractActions | IoActions }

type ContractListeners = IoListeners | { [key: string]: ContractListeners | IoListeners }

// type InferContractActions<T extends ContractActions> = T extends IoActions
//   ? T
//   : T extends { [key: string]: infer U }
//     ? U extends ContractActions
//       ? InferContractActions<U>
//       : never
//     : never

// type InferContractListeners<T extends ContractListeners> = T extends IoListeners
//   ? T
//   : T extends { [key: string]: infer U }
//     ? U extends ContractListeners
//       ? InferContractListeners<U>
//       : never
//     : never

type RecursivelyInferContractActions<T extends ContractActions> = T extends IoActions
  ? T
  : {
      [K in keyof T]: T[K] extends IoActions
        ? T[K]
        : T[K] extends ContractActions
          ? RecursivelyInferContractActions<T[K]>
          : T[K]
    }
type RecursivelyInferContractListeners<T extends ContractListeners> = T extends IoListeners
  ? T
  : {
      [K in keyof T]: T[K] extends IoListeners
        ? T[K]
        : T[K] extends ContractListeners
          ? RecursivelyInferContractListeners<T[K]>
          : T[K]
    }

type ContractRouter<
  TContractActions extends ContractActions,
  TContractListeners extends ContractListeners,
> = {
  actions: RecursivelyInferContractActions<TContractActions>
  listeners: RecursivelyInferContractListeners<TContractListeners>
}

type AnyContractRouter = ContractRouter<ContractActions, ContractListeners>

const isContractAction = (action: ContractActions | IoAction): action is IoAction => {
  return 'input' in action
}

const isContractListener = (listener: ContractActions | IoListener): listener is IoListener => {
  return 'data' in listener
}

interface ContractInstance {
  action<TContractAction extends IoAction>(action: TContractAction): TContractAction
  listener<TContractListener extends IoListener>(action: TContractListener): TContractListener
  router<TContractActions extends ContractActions, TContractListeners extends ContractListeners>(
    endpoints: ContractRouter<TContractActions, TContractListeners>
  ): ContractRouter<TContractActions, TContractListeners>
}

const initContract = (): ContractInstance => ({
  action: action => action,
  listener: listener => listener,
  router: endpoints => endpoints,
})

type DeepMerge<T, U> = (T extends object
  ? {
      [K in keyof T]: K extends keyof U ? DeepMerge<T[K], U[K]> : T[K]
    }
  : unknown) &
  U

type MergedRouter<R extends AnyContractRouter[]> = R extends [infer First, ...infer Rest]
  ? Rest extends AnyContractRouter[]
    ? DeepMerge<First, MergedRouter<Rest>>
    : never
  : unknown

function deepMerge(target: AnyContractRouter, source: AnyContractRouter): AnyContractRouter {
  const isObject = (obj: any) => obj && typeof obj === 'object'

  if (!isObject(target) || !isObject(source)) {
    return source
  }

  Object.keys(source).forEach(key => {
    const anyTarget = target as any
    const anySource = source as any
    const targetValue = anyTarget[key]
    const sourceValue = anySource[key]

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      anyTarget[key] = sourceValue.concat(targetValue)
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      anyTarget[key] = deepMerge(Object.assign({}, targetValue), sourceValue)
    } else {
      anyTarget[key] = sourceValue
    }
  })

  return target
}

const mergeContracts = <R extends AnyContractRouter[]>(...routers: R): MergedRouter<R> => {
  return routers.reduce((prev, current) => {
    return deepMerge(prev, current)
  }, {} as AnyContractRouter) as MergedRouter<R>
}

// type Paths<T> = T extends object
//   ? {
//       [K in keyof T]: T[K] extends IoAction | IoListener
//         ? `${Exclude<K, symbol>}`
//         : `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
//     }[keyof T]
//   : never

type FiltePaths<T, Filter extends string> = T extends `${infer Prefix}.${infer _Rest}`
  ? Prefix extends Filter
    ? never
    : T
  : never

type Leaves<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends IoAction | IoListener
        ? Exclude<K, symbol>
        : `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? '' : `.${Leaves<T[K]>}`}`
    }[keyof T]
  : never

type ActionPaths<Contract extends IoContract> = FiltePaths<Leaves<Contract>, 'listeners'>
type ListenerPaths<Contract extends IoContract> = FiltePaths<Leaves<Contract>, 'actions'>

type ValueAtPath<T, P> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? ValueAtPath<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never

// function getContractSchemaByPath<T extends AnyContractRouter, P extends Leaves<T>>(
//   obj: T,
//   path: P
// ): T extends any ? any : never {
//   const parts = path.split('.') as Array<keyof T>
//   let result: any = obj
//   for (const part of parts) {
//     result = result[part]
//     if (result === undefined) {
//       throw new Error(`Property '${path}' not found in object.`)
//     }
//   }
//   return result
// }

// type InferContractActionsPaths<Actions extends AnyContractRouter['actions']> = Leaves<Actions>
function getContractActionsSchemaByPath<
  T extends AnyContractRouter['actions'],
  P extends Leaves<T>,
>(obj: T, path: P): T extends any ? any : never {
  const parts = path.split('.') as Array<keyof T>
  let result: any = obj
  for (const part of parts) {
    result = result[part]
    if (result === undefined) {
      throw new Error(`Property '${path}' not found in object.`)
    }
  }
  return result
}

export {
  getContractActionsSchemaByPath,
  initContract,
  isContractAction,
  isContractListener,
  mergeContracts,
}
export type { ActionPaths, AnyContractRouter, Leaves, ListenerPaths, ValueAtPath }

// type PathsToStringProps<T> = T extends string
//   ? []
//   : {
//       [K in Extract<keyof T, string>]: T[K] extends IoAction | IoListener
//         ? [K]
//         : [K, ...PathsToStringProps<T[K]>]
//     }[Extract<keyof T, string>]

// type Join<T extends string[], D extends string> = T extends []
//   ? never
//   : T extends [infer F]
//     ? F
//     : T extends [infer F, ...infer R]
//       ? F extends string
//         ? `${F}${D}${Join<Extract<R, string[]>, D>}`
//         : never
//       : string

// type Paths<Contract extends AnyContractRouter> = Join<
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore
//   PathsToStringProps<Contract>,
//   '.'
// >

// type ValueAtPath<
//   T extends AnyContractRouter,
//   P extends Paths<T>,
// > = P extends `${infer Key}.${infer Rest}`
//   ? Key extends keyof T
//     ? ValueAtPath<T[Key], Rest>
//     : never
//   : P extends keyof T
//     ? T[P]
//     : never

// function getPropertyByPath<T extends AnyContractRouter, P extends Paths<T>>(
//   obj: T,
//   path: P
// ): T extends any ? any : never {
//   const parts = path.split('.') as Array<keyof T>
//   let result: any = obj
//   for (const part of parts) {
//     result = result[part]
//     if (result === undefined) {
//       throw new Error(`Property '${path}' not found in object.`)
//     }
//   }
//   return result
// }
// const testFn = <Contract extends AnyContractRouter>(contract: Contract) => {
//   return <ActionPath extends Paths<Contract>>(actionPath: ActionPath) => {
//     // const paths = actionPath.split('.')
//     return getPropertyByPath(contract, actionPath) as ValueAtPath<Contract, ActionPath>
//   }
// }

// const callAction = testFn(contractRouter)
// const res = callAction('actions.home.posts.update')
// res.input

// export type { ContractRouter, AnyContractRouter, InferContractActions, InferContractListeners }
// export { initContractV2 }
