/* eslint-disable @typescript-eslint/ban-types */
import { EmitEventToFunction, MaybePromise, TResponse, initContract, initTsIo } from '@ts-io/core'
import { describe, expectTypeOf, it, vi } from 'vitest'
import { z } from 'zod'

const c = initContract()
const contract = c.actions({
  actions: {
    fireAndForget: {
      input: z.object({ message: z.string() }),
    },
    requestResponse: {
      input: z.object({ message: z.string() }),
      response: z.object({ message: z.string(), timestamp: z.number() }),
    },
  },
  listeners: {
    listener: {
      data: z.object({ newMessage: z.string() }),
    },
  },
})

const s = initTsIo({}, contract)

describe('server', () => {
  describe('action creator', () => {
    expectTypeOf(s.action).toBeFunction()
    expectTypeOf(s.action).parameter(0).toMatchTypeOf<'fireAndForget' | 'requestResponse'>()
  })

  describe('middleware creator', () => {
    expectTypeOf(s.middleware).toBeFunction()
    expectTypeOf(s.middleware)
      .parameter(0)
      .parameter(0)
      .toMatchTypeOf<{ ctx: {}; input: unknown }>()
  })

  describe('caller', () => {
    it('infers action call parameters correctly', () => {
      const handler = vi.fn()
      const fireAndForgetAction = s.action('fireAndForget').handler(handler)

      expectTypeOf(fireAndForgetAction).toBeFunction()
      expectTypeOf(fireAndForgetAction).parameter(0).toEqualTypeOf<{
        path: string
        input: { message: string }
        emitTo: EmitEventToFunction<typeof contract.listeners>
      }>()
    })
  })

  describe('handler', () => {
    it('infers action handler context correctly', () => {
      const fireAndForgetAction = s.action('fireAndForget')

      expectTypeOf(fireAndForgetAction.handler)
        .parameter(0)
        .parameter(0)
        .toMatchTypeOf<{ ctx: {} }>()

      const actionWithMiddleware = s
        .action('fireAndForget')
        .use(opts => opts.next({ ctx: { userName: 'John' } }))
        .use(opts => opts.next({ ctx: { lastName: 'Doe' } }))
        .use(opts => opts.next())

      expectTypeOf(actionWithMiddleware.handler)
        .parameter(0)
        .parameter(0)
        .toMatchTypeOf<{ ctx: { userName: string; lastName: string } }>()
    })

    it('infers action handler input correctly', () => {
      const fireAndForgetAction = s.action('fireAndForget')

      expectTypeOf(fireAndForgetAction.handler)
        .parameter(0)
        .parameter(0)
        .toMatchTypeOf<{ input: { message: string } }>()
    })

    it('infers action handler emitter correctly', () => {
      const fireAndForgetAction = s.action('fireAndForget')

      expectTypeOf(fireAndForgetAction.handler)
        .parameter(0)
        .parameter(0)
        .toMatchTypeOf<{ emitEventTo: EmitEventToFunction<typeof contract.listeners> }>()
    })

    it('infers action return type correctly', () => {
      const handler = vi.fn()
      const fireAndForgetAction = s.action('fireAndForget').handler(handler)

      expectTypeOf(fireAndForgetAction).toBeFunction()
      expectTypeOf(fireAndForgetAction).parameter(0).toEqualTypeOf<{
        path: string
        input: { message: string }
        emitTo: EmitEventToFunction<typeof contract.listeners>
      }>()
      expectTypeOf(fireAndForgetAction).returns.toEqualTypeOf<MaybePromise<void>>()

      const requestResponseAction = s.action('requestResponse').handler(handler)

      expectTypeOf(requestResponseAction).toBeFunction()
      expectTypeOf(requestResponseAction).parameter(0).toEqualTypeOf<{
        path: string
        input: { message: string }
        emitTo: EmitEventToFunction<typeof contract.listeners>
      }>()
      expectTypeOf(requestResponseAction).returns.toEqualTypeOf<
        MaybePromise<
          TResponse<{
            message: string
            timestamp: number
          }>
        >
      >()
    })
  })
})
