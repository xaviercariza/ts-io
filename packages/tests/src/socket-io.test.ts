import { initContract, initTsIo } from '@tsio/core'
import { describe, expect, vi } from 'vitest'
import { z } from 'zod'
import { waitForSocketIoClientToReceiveEvent, waitForSocketIoServerToReceiveEvent } from './utils'
import { socketsTest } from './utils'

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

const c = initContract()
const contract = c.router({
  actions: {
    fireAndForget: {
      input: PostSchema.omit({ id: true }),
    },
    fireAndForgetWithEmit: {
      input: PostSchema.omit({ id: true }),
    },
    requestResponse: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    requestResponseWithEmit: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    requestResponseError: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
  },
  listeners: {
    onActionResponse: {
      data: PostSchema,
    },
  },
})

const context = { userName: 'Xavier' }
const tsIo = initTsIo(context, contract)

describe('socketio', () => {
  describe('fire and forget actions', () => {
    socketsTest(
      'handles basic fire and forget action',
      async ({ socketIoFixture, onTestFinished }) => {
        // Initialize sockets
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)

        // Create router with action
        const actionHandler = vi.fn()
        const router = tsIo.router({
          ...ACTIONS_MOCK,
          fireAndForget: tsIo.action('fireAndForget').handler(actionHandler),
        })

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket(router, setup.server.adapter)

        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        setup.client.socket1.client.actions.fireAndForget(actionPayload)

        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actions.fireAndForget'
        )

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actions.fireAndForget',
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
        const router = tsIo.router({
          ...ACTIONS_MOCK,
          fireAndForgetWithEmit: tsIo.action('fireAndForgetWithEmit').handler(
            actionHandler.mockImplementation(({ emitEventTo }) => {
              emitEventTo('listeners.onActionResponse', setup.client.socket2.socket.id, {
                id: 'post-1',
                title: 'This is the title',
                body: 'This is the body',
              })
            })
          ),
        })

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket(router, setup.server.adapter)

        // Prepare
        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        // Set client listener to server action
        const listenerHandler = vi.fn()
        setup.client.socket2.client.listeners.onActionResponse(listenerHandler)

        // Run action
        setup.client.socket1.client.actions.fireAndForgetWithEmit(actionPayload)

        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actions.fireAndForgetWithEmit'
        )

        // Wait for client to receive server emit event
        await waitForSocketIoClientToReceiveEvent<Contract>(
          setup.client.socket2.socket,
          'listeners.onActionResponse'
        )

        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actions.fireAndForgetWithEmit',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })

        // Assert server action has emitted an event to a client with correct parameters
        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'listeners.onActionResponse',
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
        const router = tsIo.router({
          ...ACTIONS_MOCK,
          requestResponse: tsIo.action('requestResponse').handler(
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
        })

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket(router, setup.server.adapter)

        // Prepare
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        // Run action
        setup.client.socket1.client.actions.requestResponse(actionPayload)

        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actions.requestResponse'
        )

        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actions.requestResponse',
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
        const router = tsIo.router({
          ...ACTIONS_MOCK,
          requestResponseWithEmit: tsIo.action('requestResponseWithEmit').handler(
            actionHandler.mockImplementation(({ input, emitEventTo }) => {
              const { title, body } = input
              const newPost = { id: 'post-1', title, body }
              emitEventTo('listeners.onActionResponse', setup.client.socket2.socket.id, newPost)
              return { success: true, data: newPost }
            })
          ),
        })

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket(router, setup.server.adapter)

        // Prepare
        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        // Set client listener to server action
        const listenerHandler = vi.fn()
        setup.client.socket2.client.listeners.onActionResponse(listenerHandler)

        // Run action
        const action = setup.client.socket1.client.actions.requestResponseWithEmit(actionPayload)

        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actions.requestResponseWithEmit'
        )

        // Wait for client to receive server emit event
        await waitForSocketIoClientToReceiveEvent<Contract>(
          setup.client.socket2.socket,
          'listeners.onActionResponse'
        )

        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actions.requestResponseWithEmit',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })

        // Assert server action has emitted an event to a client with correct parameters
        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'listeners.onActionResponse',
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
        const router = tsIo.router({
          ...ACTIONS_MOCK,
          requestResponseError: tsIo.action('requestResponseError').handler(
            actionHandler.mockImplementation(() => {
              return { success: false, error: 'Action with ack error' }
            })
          ),
        })

        // Attach router to socket
        socketIoFixture.attachTsIoToWebSocket(router, setup.server.adapter)

        // Prepare
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        // Run action
        const action = setup.client.socket1.client.actions.requestResponseError(actionPayload)

        // Wait for server to receive action event
        await waitForSocketIoServerToReceiveEvent<Contract>(
          setup.server.socket,
          'actions.requestResponseError'
        )

        // Assert action handler has been called with correct parameters
        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actions.requestResponseError',
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
