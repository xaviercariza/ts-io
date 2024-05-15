import { defineContract, initTsIo } from '@tsio/core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
})

const contract = defineContract({
  actionsRouter: {
    actionWithoutMiddlewares: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    actionWithEmptyMiddleware: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    actionWithUserMiddleware: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
  },
  listenersRouter: {},
})

const initialContext = { userName: 'Xavier' }
const s = initTsIo(contract, initialContext)
const emptyContextMiddleware = s.middleware(
  vi.fn().mockImplementation(opts => {
    return opts.next()
  })
)

const userMiddleware = s.middleware(
  vi.fn().mockImplementation(opts => {
    return opts.next({
      ctx: {
        userName: 'Clara',
      },
    })
  })
)

const actionWithoutMiddlewaresHandler = vi.fn()
const actionWithEmptyMiddlewareHandler = vi.fn()
const actionWithUserMiddlewareHandler = vi.fn()

const actionsRouter = s.router.actionsRouter.create(a => ({
  actionWithoutMiddlewares: a.actionWithoutMiddlewares.handler(actionWithoutMiddlewaresHandler),
  actionWithEmptyMiddleware: a.actionWithEmptyMiddleware
    .use(emptyContextMiddleware)
    .handler(actionWithEmptyMiddlewareHandler),
  actionWithUserMiddleware: a.actionWithUserMiddleware
    .use(userMiddleware)
    .handler(actionWithUserMiddlewareHandler),
}))
const router = s.router.create({
  actionsRouter,
  listenersRouter: {},
})

describe('middlewares', () => {
  it('should call handler w/ initial context', async () => {
    await router.actionsRouter.actionWithoutMiddlewares({
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

    await router.actionsRouter.actionWithEmptyMiddleware({
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
    await router.actionsRouter.actionWithUserMiddleware({
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
