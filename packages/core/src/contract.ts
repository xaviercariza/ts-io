import { ActionOptions, IoContract } from './types'

type RecursivelyProcessContractActions<Contract extends IoContract> = {
  [K in keyof Contract]: Contract[K]
}

type RecursivelyApplyOptions<Contract extends IoContract, TOptions extends ActionOptions> = {
  [TRouterKey in keyof Contract]: Contract[TRouterKey] extends IoContract
    ? RecursivelyApplyOptions<Contract[TRouterKey], TOptions>
    : Contract[TRouterKey]
}

type ContractInstance = {
  actions: <Contract extends IoContract, TOptions extends ActionOptions>(
    actions: RecursivelyProcessContractActions<Contract>
  ) => RecursivelyApplyOptions<Contract, TOptions>
}

export const initContract = (): ContractInstance => ({
  actions: actions => actions,
})
