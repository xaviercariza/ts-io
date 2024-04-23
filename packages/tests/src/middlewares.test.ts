import { initContract, initTsIo } from '@tsio/core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
})

const c = initContract()
const contract = c.router({
  actions: {
    actionWithoutMiddlewares: {
      input: PostSchema.omit({ id: true }),
    },
    actionWithEmptyMiddleware: {
      input: PostSchema.omit({ id: true }),
    },
    actionWithUserMiddleware: {
      input: PostSchema.omit({ id: true }),
    },
  },
  listeners: {},
})

const initialContext = { userName: 'Xavier' }
const s = initTsIo(initialContext, contract)

const actionWithoutMiddlewaresHandler = vi.fn()
const actionWithoutMiddlewares = s
  .action('actionWithoutMiddlewares')
  .handler(actionWithoutMiddlewaresHandler)

const emptyContextMiddleware = s.middleware(
  vi.fn().mockImplementation(opts => {
    return opts.next()
  })
)
const actionWithEmptyMiddlewareHandler = vi.fn()
const actionWithEmptyMiddleware = s
  .action('actionWithEmptyMiddleware')
  .use(emptyContextMiddleware)
  .handler(actionWithEmptyMiddlewareHandler)

const userMiddleware = s.middleware(
  vi.fn().mockImplementation(opts => {
    return opts.next({
      ctx: {
        userName: 'Clara',
      },
    })
  })
)
const actionWithUserMiddlewareHandler = vi.fn()
const actionWithUserMiddleware = s
  .action('actionWithUserMiddleware')
  .use(userMiddleware)
  .handler(actionWithUserMiddlewareHandler)

const router = s.router({
  actionWithoutMiddlewares,
  actionWithEmptyMiddleware,
  actionWithUserMiddleware,
})

describe('middlewares', () => {
  it('should call handler w/ initial context', async () => {
    await router.actionWithoutMiddlewares({
      path: 'action-key',
      input: {
        title: 'This is the title',
        body: 'This is the body',
      },
      emitTo: vi.fn(),
    })

    expect(actionWithoutMiddlewaresHandler).toHaveBeenCalledTimes(1)
    expect(actionWithoutMiddlewaresHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: initialContext,
      })
    )

    await router.actionWithEmptyMiddleware({
      path: 'action-key',
      input: {
        title: 'This is the title',
        body: 'This is the body',
      },
      emitTo: vi.fn(),
    })

    expect(actionWithEmptyMiddlewareHandler).toHaveBeenCalledTimes(1)
    expect(actionWithEmptyMiddlewareHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: initialContext,
      })
    )
  })

  it('should call handler w/ updated context from middleware', async () => {
    await router.actionWithUserMiddleware({
      path: 'action-key',
      input: {
        title: 'This is the title',
        body: 'This is the body',
      },
      emitTo: vi.fn(),
    })

    expect(actionWithUserMiddlewareHandler).toHaveBeenCalledTimes(1)
    expect(actionWithUserMiddlewareHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: {
          userName: 'Clara',
        },
      })
    )
  })
})
