import { IoListeners, TResponse, UnsetMarker } from '../types'
import { EmitEventToFunction } from './emitter'
import { MaybePromise } from './types'

export interface ActionCallOptions<Listeners extends IoListeners | undefined, TInput> {
  path: string
  input: TInput
  emitTo: EmitEventToFunction<Listeners>
}

type ActionResolverParams<Listeners extends IoListeners, TContext, TInput> = {
  ctx: TContext
  input: TInput
  emitEventTo: EmitEventToFunction<Listeners>
}

export type AnyActionResolver = ActionResolver<any, any, any, any>
export type ActionResolver<Listeners extends IoListeners, TContext, TInput, TOutput> = (
  params: ActionResolverParams<Listeners, TContext, TInput>
) => MaybePromise<TOutput extends UnsetMarker ? void : TResponse<TOutput>>

export type AnyAction = Action<any, any, any>
export type Action<Listeners extends IoListeners | undefined, TInput, TOutput> = (
  params: ActionCallOptions<Listeners, TInput>
) => TOutput extends UnsetMarker ? MaybePromise<void> : MaybePromise<TResponse<TOutput>>
