/* eslint-disable no-async-promise-executor */
import { Server, Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createSockets, setupTestServer, waitForServerToReceiveEvent } from './test-utils/socket'
import { initClient } from './client'
import { initContract } from './contract'
import { initServer } from './server'
import { InferContractActions, InferContractListeners } from './types'

type TestContract = typeof contract

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
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

const initialContext = { userPlayerId: 'user-2' }
const s = initServer(initialContext)
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

type ServerToClientEvents = InferContractListeners<typeof contract>
type ClientToServerEvents = InferContractActions<typeof contract>

describe('websocket integration test', () => {
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
    it('should handle basic action success correctly', async () => {
      const serverActionHandler = vi.spyOn(actions.basicActionSuccess, 'handler')
      const client = initClient(clientEmitterSocket, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      await client.actions.basicActionSuccess(actionPayload)

      await waitForServerToReceiveEvent<TestContract>(serverEmitterSocket, 'basicActionSuccess')

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: initialContext,
        emitEventTo: expect.any(Function),
      })
    })

    it('should call client event listener when server emits event', async () =>
      new Promise<void>(async done => {
        const emitterClient = initClient(clientEmitterSocket, contract)
        const serverActionHandler = vi.spyOn(actions.basicActionWithEmit, 'handler')

        const listenerClient = initClient(clientListenerSocket, contract)

        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        listenerClient.listeners.onPostCreated(response => {
          expect(response).toStrictEqual({ ...actionPayload, id: 'post-1' })
          done()
        })

        await emitterClient.actions.basicActionWithEmit(actionPayload)

        await waitForServerToReceiveEvent<TestContract>(serverEmitterSocket, 'basicActionWithEmit')

        expect(serverActionHandler).toHaveBeenCalledTimes(1)
        expect(serverActionHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            input: actionPayload,
            ctx: initialContext,
            emitEventTo: expect.any(Function),
          })
        )
      }))
  })

  describe('acknowledgement actions', () => {
    it('should handle action with acknowledgement success correctly', async () => {
      const serverActionHandler = vi.spyOn(actions.actionWithAckSuccess, 'handler')
      const client = initClient(clientEmitterSocket, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      const response = await client.actions.actionWithAckSuccess(actionPayload)

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: initialContext,
        emitEventTo: expect.any(Function),
      })

      expect(response).toStrictEqual({
        success: true,
        data: { id: 'post-1', ...actionPayload },
      })
    })

    it('should handle action with acknowledgement success correctly', async () =>
      new Promise<void>(async done => {
        const serverActionHandler = vi.spyOn(actions.actionWithAckSuccessWithEmit, 'handler')
        const client = initClient(clientEmitterSocket, contract)
        const listenerClient = initClient(clientListenerSocket, contract)

        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        listenerClient.listeners.onPostCreated(response => {
          expect(response).toStrictEqual({ ...actionPayload, id: 'post-1' })
          done()
        })

        const response = await client.actions.actionWithAckSuccessWithEmit(actionPayload)

        expect(serverActionHandler).toHaveBeenCalledTimes(1)
        expect(serverActionHandler).toHaveBeenCalledWith({
          input: actionPayload,
          ctx: initialContext,
          emitEventTo: expect.any(Function),
        })

        expect(response).toStrictEqual({
          success: true,
          data: { id: 'post-1', ...actionPayload },
        })
      }))

    it('should handle action with acknowledgement error correctly', async () => {
      const serverActionHandler = vi.spyOn(actions.actionWithAckError, 'handler')
      const client = initClient(clientEmitterSocket, contract)

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }

      const response = await client.actions.actionWithAckError(actionPayload)

      expect(serverActionHandler).toHaveBeenCalledTimes(1)
      expect(serverActionHandler).toHaveBeenCalledWith({
        input: actionPayload,
        ctx: initialContext,
        emitEventTo: expect.any(Function),
      })

      expect(response).toStrictEqual({
        success: false,
        error: 'Action with ack error',
      })
    })
  })
})
