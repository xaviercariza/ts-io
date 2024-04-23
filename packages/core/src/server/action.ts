import { IoContract, TResponse, UnsetMarker } from '../types'
import { EmitEventToFunction } from './emitter'
import { MaybePromise } from './types'

export interface ActionCallOptions<Contract extends IoContract, TInput> {
  path: string
  input: TInput
  emitTo: EmitEventToFunction<Contract>
}

type ActionResolverParams<Contract extends IoContract, TContext, TInput> = {
  ctx: TContext
  input: TInput
  emitEventTo: EmitEventToFunction<Contract>
}

export type AnyActionResolver = ActionResolver<any, any, any, any>
export type ActionResolver<Contract extends IoContract, TContext, TInput, TOutput> = (
  params: ActionResolverParams<Contract, TContext, TInput>
) => MaybePromise<TOutput extends UnsetMarker ? void : TResponse<TOutput>>

export type AnyAction = Action<any, any, any>
export type Action<Contract extends IoContract, TInput, TOutput> = (
  params: ActionCallOptions<Contract, TInput>
) => TOutput extends UnsetMarker ? MaybePromise<void> : MaybePromise<TResponse<TOutput>>
