import {
  InferContractActions,
  InferContractListeners,
  initContract,
  initNewClient,
  initTsIoServer,
} from '@ts-io/core'
import { createSocketIoClientProxy } from '@ts-io/socketio/client'
import { Server, Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createSockets, setupTestServer, waitForServerToReceiveEvent } from './test-utils'
import { z } from 'zod'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
})

const c = initContract()
const contract = c.actions({
  actions: {
    basicActionSuccess: {
      input: PostSchema.omit({ id: true }),
    },
    basicActionWithEmit: {
      input: PostSchema.omit({ id: true }),
    },
    actionWithAckSuccess: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    actionWithAckSuccessWithEmit: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    actionWithAckError: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
  },
  listeners: {
    onPostCreated: {
      data: PostSchema,
    },
  },
})

const context = { userId: 'user-2' }
const s = initTsIoServer(context)
const actions = s.actions(contract, {
  basicActionSuccess: {
    handler: () => {},
  },
  basicActionWithEmit: {
    handler: ({ emitEventTo }) => {
      const newPost = {
        id: 'post-1',
        title: 'This is the title',
        body: 'This is the body',
      }

      emitEventTo('onPostCreated', 'room-1', newPost)
    },
  },
  actionWithAckSuccess: {
    handler: ({ input }) => {
      const { title, body } = input
      const newPost = {
        id: 'post-1',
        title,
        body,
      }
      return { success: true, data: newPost }
    },
  },
  actionWithAckSuccessWithEmit: {
    handler: ({ input, emitEventTo }) => {
      const { title, body } = input
      const newPost = {
        id: 'post-1',
        title,
        body,
      }

      emitEventTo('onPostCreated', 'room-1', newPost)

      return { success: true, data: newPost }
    },
  },
  actionWithAckError: {
    handler: () => {
      return { success: false, error: 'Action with ack error' }
    },
  },
})

type TestContract = typeof contract

type ServerToClientEvents = InferContractListeners<typeof contract>
type ClientToServerEvents = InferContractActions<typeof contract>

describe('socketio', () => {
  let io: Server

  let serverEmitterSocket: ServerSocket<ClientToServerEvents, ServerToClientEvents> | undefined
  let clientEmitterSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>

  let serverListenerSocket: ServerSocket<ClientToServerEvents, ServerToClientEvents> | undefined
  let clientListenerSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>

  beforeAll(async () => {
    io = setupTestServer()

    const emitterSockets = await createSockets(io, contract, actions)
    clientEmitterSocket = emitterSockets.clientSocket
    serverEmitterSocket = emitterSockets.serverSocket

    const listenerSockets = await createSockets(io, contract, actions)
    clientListenerSocket = listenerSockets.clientSocket
    serverListenerSocket = listenerSockets.serverSocket
    serverListenerSocket?.join('room-1')
  })

  afterAll(() => {
    io.close()
    clientEmitterSocket.close()
    clientListenerSocket.close()
  })

  describe('fire and forget actions', () => {
    it('handles basic action', async () => {
      const serverActionHandler = vi.spyOn(actions.basicActionSuccess, 'handler')

      const socketIoClientAdapter = createSocketIoClientProxy(clientEmitterSocket)
      const client = initNewClient(socketIoClientAdapter, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      await client.actions.basicActionSuccess(actionPayload)

      await waitForServerToReceiveEvent<TestContract>(serverEmitterSocket, 'basicActionSuccess')

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: context,
        emitEventTo: expect.any(Function),
      })
    })

    it('handles basic action w/ emit', async () => {
      const serverActionHandler = vi.spyOn(actions.basicActionWithEmit, 'handler')

      const emitterIoClientAdapter = createSocketIoClientProxy(clientEmitterSocket)
      const emitterClient = initNewClient(emitterIoClientAdapter, contract)

      const listenerIoClientAdapter = createSocketIoClientProxy(clientListenerSocket)
      const listenerClient = initNewClient(listenerIoClientAdapter, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      listenerClient.listeners.onPostCreated(async response => {
        await vi.waitFor(() => expect(response).toStrictEqual({ ...actionPayload, id: 'post-1' }))
      })

      await emitterClient.actions.basicActionWithEmit(actionPayload)

      await waitForServerToReceiveEvent<TestContract>(serverEmitterSocket, 'basicActionWithEmit')

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          input: actionPayload,
          ctx: context,
          emitEventTo: expect.any(Function),
        })
      )
    })
  })

  describe('request-response actions', () => {
    it('handles action w/ success response', async () => {
      const serverActionHandler = vi.spyOn(actions.actionWithAckSuccess, 'handler')

      const emitterIoClientAdapter = createSocketIoClientProxy(clientEmitterSocket)
      const emitterClient = initNewClient(emitterIoClientAdapter, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      const response = await emitterClient.actions.actionWithAckSuccess(actionPayload)

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: context,
        emitEventTo: expect.any(Function),
      })
      expect(response).toStrictEqual({
        success: true,
        data: { id: 'post-1', ...actionPayload },
      })
    })

    it('handles action w/ success response and w/ emit', async () => {
      const serverActionHandler = vi.spyOn(actions.actionWithAckSuccessWithEmit, 'handler')

      const emitterIoClientAdapter = createSocketIoClientProxy(clientEmitterSocket)
      const emitterClient = initNewClient(emitterIoClientAdapter, contract)

      const listenerIoClientAdapter = createSocketIoClientProxy(clientListenerSocket)
      const listenerClient = initNewClient(listenerIoClientAdapter, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      listenerClient.listeners.onPostCreated(async response => {
        await vi.waitFor(() => expect(response).toStrictEqual({ ...actionPayload, id: 'post-1' }))
      })

      const response = await emitterClient.actions.actionWithAckSuccessWithEmit(actionPayload)

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: context,
        emitEventTo: expect.any(Function),
      })
      expect(response).toStrictEqual({
        success: true,
        data: { id: 'post-1', ...actionPayload },
      })
    })

    it('handles action w/ error response', async () => {
      const serverActionHandler = vi.spyOn(actions.actionWithAckError, 'handler')

      const emitterIoClientAdapter = createSocketIoClientProxy(clientEmitterSocket)
      const emitterClient = initNewClient(emitterIoClientAdapter, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      const response = await emitterClient.actions.actionWithAckError(actionPayload)

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: context,
        emitEventTo: expect.any(Function),
      })
      expect(response).toStrictEqual({
        success: false,
        error: 'Action with ack error',
      })
    })
  })
})
