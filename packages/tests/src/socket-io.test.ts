import { defineContract, initTsIo } from '@tsio/core'
import { describe, expect, vi } from 'vitest'
import { z } from 'zod'
import {
  socketsTest,
  waitForSocketIoClientToReceiveEvent,
  waitForSocketIoServerToReceiveEvent,
} from './utils'

type Context = { userName: string }
type Contract = typeof contract

const ACTIONS_MOCK = {
  fireAndForget: vi.fn(),
  fireAndForgetWithEmit: vi.fn(),
  requestResponse: vi.fn(),
  requestResponseWithEmit: vi.fn(),
  requestResponseError: vi.fn(),
}

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
})

const contract = defineContract({
  actionsRouter: {
    fireAndForget: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    fireAndForgetWithEmit: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    requestResponse: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    requestResponseWithEmit: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    requestResponseError: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
  },
  listenersRouter: {
    onActionResponse: {
      type: 'listener',
      data: PostSchema,
    },
  },
})

const context: Context = { userName: 'Xavier' }
const tsIo = initTsIo.context<Context>().create(contract)
const createContext = () => context

describe('socketio', () => {
  describe('fire and forget actions', () => {
    socketsTest(
      'handles basic fire and forget action',
      async ({ socketIoFixture, onTestFinished }) => {
        // Initialize sockets
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)

        // Create router with action
        const actionHandler = vi.fn()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            fireAndForget: a.actionsRouter.fireAndForget.handler(actionHandler),
          },
          listenersRouter: {},
        }))

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })

        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        setup.client.socket1.client.actions.actionsRouter.fireAndForget(actionPayload)

        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actionsRouter.fireAndForget'
        )

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.fireAndForget',
          ctx: context,
          input: actionPayload,
          emitEventTo: setup.server.adapter.emitTo,
        })

        onTestFinished(closeConnections)
      }
    )

    socketsTest(
      'handles fire and forget action w/ emit to other client',
      async ({ socketIoFixture, onTestFinished }) => {
        // Initialize sockets
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)

        // Create router with action
        const actionHandler = vi.fn()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            fireAndForgetWithEmit: a.actionsRouter.fireAndForgetWithEmit.handler(
              actionHandler.mockImplementation(({ emitEventTo }) => {
                emitEventTo('listenersRouter.onActionResponse', setup.client.socket2.socket.id, {
                  id: 'post-1',
                  title: 'This is the title',
                  body: 'This is the body',
                })
              })
            ),
          },
          listenersRouter: {},
        }))

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })

        // Prepare
        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        // Set client listener to server action
        const listenerHandler = vi.fn()
        setup.client.socket2.client.listeners.listenersRouter.onActionResponse(listenerHandler)

        // Run action
        setup.client.socket1.client.actions.actionsRouter.fireAndForgetWithEmit(actionPayload)

        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actionsRouter.fireAndForgetWithEmit'
        )

        // Wait for client to receive server emit event
        await waitForSocketIoClientToReceiveEvent<Contract>(
          setup.client.socket2.socket,
          'listenersRouter.onActionResponse'
        )

        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.fireAndForgetWithEmit',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })

        // Assert server action has emitted an event to a client with correct parameters
        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'listenersRouter.onActionResponse',
          setup.client.socket2.socket.id,
          {
            body: 'This is the body',
            id: 'post-1',
            title: 'This is the title',
          }
        )

        // Assert client listener has been called correctly with correct payload
        expect(listenerHandler).toHaveBeenCalledTimes(1)
        expect(listenerHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        // Close socket connections
        onTestFinished(closeConnections)
      }
    )
  })

  describe('request-response actions', () => {
    socketsTest(
      'handles basic request-response action w/ success response',
      async ({ socketIoFixture, onTestFinished }) => {
        // Initialize sockets
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
        // Create router with action
        const actionHandler = vi.fn()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponse: a.actionsRouter.requestResponse.handler(
              actionHandler.mockImplementation(({ input }) => {
                const { title, body } = input
                const newPost = {
                  id: 'post-1',
                  title,
                  body,
                }
                return { success: true, data: newPost }
              })
            ),
          },
          listenersRouter: {},
        }))
        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })
        // Prepare
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }
        // Run action
        setup.client.socket1.client.actions.actionsRouter.requestResponse(actionPayload)
        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actionsRouter.requestResponse'
        )
        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponse',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })
        // Close socket connections
        onTestFinished(closeConnections)
      }
    )

    socketsTest(
      'handles request-response action w/ emit to other client',
      async ({ socketIoFixture, onTestFinished }) => {
        // Initialize sockets
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
        // Create router with action
        const actionHandler = vi.fn()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponseWithEmit: a.actionsRouter.requestResponseWithEmit.handler(
              actionHandler.mockImplementation(({ input, emitEventTo }) => {
                const { title, body } = input
                const newPost = { id: 'post-1', title, body }
                emitEventTo(
                  'listenersRouter.onActionResponse',
                  setup.client.socket2.socket.id,
                  newPost
                )
                return { success: true, data: newPost }
              })
            ),
          },
          listenersRouter: {},
        }))
        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })
        // Prepare
        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }
        // Set client listener to server action
        const listenerHandler = vi.fn()
        setup.client.socket2.client.listeners.listenersRouter.onActionResponse(listenerHandler)
        // Run action
        const action =
          setup.client.socket1.client.actions.actionsRouter.requestResponseWithEmit(actionPayload)

        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actionsRouter.requestResponseWithEmit'
        )
        // Wait for client to receive server emit event
        await waitForSocketIoClientToReceiveEvent<Contract>(
          setup.client.socket2.socket,
          'listenersRouter.onActionResponse'
        )
        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponseWithEmit',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })
        // Assert server action has emitted an event to a client with correct parameters
        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'listenersRouter.onActionResponse',
          setup.client.socket2.socket.id,
          {
            body: 'This is the body',
            id: 'post-1',
            title: 'This is the title',
          }
        )
        // Assert server has returned payload to the client
        expect(action).resolves.toStrictEqual({
          success: true,
          data: { ...actionPayload, id: 'post-1' },
        })
        // Assert client listener has been called correctly with correct payload
        expect(listenerHandler).toHaveBeenCalledTimes(1)
        expect(listenerHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })
        // Close socket connections
        onTestFinished(closeConnections)
      }
    )

    socketsTest(
      'handles basic request-response action w/ error response',
      async ({ socketIoFixture, onTestFinished }) => {
        // Initialize sockets
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
        // Create router with action
        const actionHandler = vi.fn()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponseError: a.actionsRouter.requestResponseError.handler(
              actionHandler.mockImplementation(() => {
                return { success: false, error: 'Action with ack error' }
              })
            ),
          },
          listenersRouter: {},
        }))
        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })
        // Prepare
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }
        // Run action
        const action =
          setup.client.socket1.client.actions.actionsRouter.requestResponseError(actionPayload)
        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actionsRouter.requestResponseError'
        )
        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponseError',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })
        // Assert server has returned payload to the client
        expect(action).resolves.toStrictEqual({
          success: false,
          error: 'Action with ack error',
        })
        // Close socket connections
        onTestFinished(closeConnections)
      }
    )
  })
})
