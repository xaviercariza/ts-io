import { ZodType } from 'zod'
import { DefaultValue, IoListeners, ParseSchema, UnsetMarker } from '../types'
import { Action, ActionCallOptions, ActionResolver, AnyAction, AnyActionResolver } from './action'
import {
  AnyMiddlewareFn,
  AnyMiddlewareFunctionParams,
  MiddlewareBuilder,
  MiddlewareFunction,
  MiddlewareResult,
  isMiddlewareResolver,
} from './middleware'
import { Overwrite } from './types'
import { mergeWithoutOverrides } from './utils'

type ActionBuilderDef = {
  context: unknown
  input?: ZodType
  resolver?: AnyActionResolver
  middlewares: AnyMiddlewareFn[] // (AnyMiddlewareFunction | AnyMiddlewareResolver)[]
}

type AnyActionBuilderDef = ActionBuilderDef

type AnyActionBuilder = ActionBuilder<any, any, any, any, any>

export interface ActionBuilder<
  Listeners extends IoListeners,
  TInitialContext, // initial context
  TContextOverrides, // latest context
  TInput,
  TOutput,
> {
  _def: ActionBuilderDef
  use<TContextOut>(
    fn:
      | MiddlewareBuilder<Overwrite<TInitialContext, TContextOverrides>, TContextOut, TInput>
      | MiddlewareFunction<TInitialContext, TContextOverrides, TContextOut, TInput>
  ): ActionBuilder<
    Listeners,
    TInitialContext,
    Overwrite<TContextOverrides, TContextOut>,
    TInput,
    TOutput
  >
  handler(
    resolver: ActionResolver<Listeners, TContextOverrides, TInput, TOutput>
  ): Action<Listeners, TInput, DefaultValue<TOutput, UnsetMarker>>
}

function createNewBuilder(
  def1: AnyActionBuilderDef,
  def2: Partial<AnyActionBuilderDef>
): AnyActionBuilder {
  const { middlewares = [], ...rest } = def2

  return createBuilder({
    ...mergeWithoutOverrides(def1, rest),
    middlewares: [...def1.middlewares, ...middlewares],
  })
}

type BuilderDefinition<Listeners extends IoListeners, TContext extends object, TInput, TOutput> = {
  listeners: Listeners
  ctx: TContext
  input: TInput
  output: TOutput
}

export function createBuilder<Definition extends BuilderDefinition<any, any, any, any>>(
  initDef: Partial<AnyActionBuilderDef> = {}
): ActionBuilder<
  Definition['listeners'],
  Definition['ctx'],
  object,
  ParseSchema<Definition['input']>,
  ParseSchema<Definition['output']>
> {
  const _def: AnyActionBuilderDef = {
    context: {},
    middlewares: [],
    ...initDef,
  }

  const builder: AnyActionBuilder = {
    _def,
    use(middlewareBuilderOrFn) {
      const middlewares =
        '_middlewares' in middlewareBuilderOrFn
          ? middlewareBuilderOrFn._middlewares
          : [middlewareBuilderOrFn]

      return createNewBuilder(_def, {
        middlewares: middlewares.map(mw => ({ type: 'middleware', fn: mw })),
      })
    },
    handler(resolver) {
      return createResolver(_def, resolver) as AnyAction
    },
  }

  return builder
}

function createResolver(_defIn: AnyActionBuilderDef, resolver: AnyActionResolver) {
  const finalBuilder = createNewBuilder(_defIn, {
    resolver,
    middlewares: [
      {
        type: 'resolver',
        fn: async function resolveMiddleware(opts) {
          const data = await resolver(opts)
          return {
            ok: true,
            data,
            ctx: opts.ctx,
          } as const
        },
      },
    ],
  })

  const invoke = createActionCaller(finalBuilder._def)
  return invoke
}

function createActionCaller(_def: AnyActionBuilderDef): AnyAction {
  async function action(opts: ActionCallOptions<any, AnyActionBuilderDef['input']>) {
    // run the middlewares recursively with the resolver as the last one
    async function callRecursive(
      callOpts: {
        ctx: any
        index: number
      } = {
        index: 0,
        ctx: _def.context,
      }
    ): Promise<MiddlewareResult<any>> {
      try {
        const middleware = _def.middlewares[callOpts.index]!

        const params: AnyMiddlewareFunctionParams = {
          ctx: callOpts.ctx,
          path: opts.path,
          input: opts.input,
        }

        if (isMiddlewareResolver(middleware)) {
          return await middleware.fn({
            ...params,
            emitEventTo: opts.emitTo,
          })
        }

        return await middleware.fn({
          ...params,
          next(_nextOpts?: any) {
            const nextOpts = _nextOpts as
              | {
                  ctx?: Record<string, unknown>
                }
              | undefined

            return callRecursive({
              index: callOpts.index + 1,
              ctx:
                nextOpts && 'ctx' in nextOpts ? { ...callOpts.ctx, ...nextOpts.ctx } : callOpts.ctx,
            })
          },
        })
      } catch (cause) {
        return {
          ok: false,
          error: cause as Error,
        }
      }
    }

    // there's always at least one "next" since we wrap this.resolver in a middlewareq
    const result = await callRecursive()
    if (!result) {
      throw new Error('No result from middlewares - did you forget to `return next()`?')
    }
    if (!result.ok) {
      // re-throw original error
      throw result.error
    }
    return result.data
  }

  action._def = _def

  // FIXME typecast shouldn't be needed - fixittt
  return action as unknown as AnyAction
}
