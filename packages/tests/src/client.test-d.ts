import { attachTsIoToWebSocket, initContract, initNewClient, initTsIo } from '@tsio/core'
import { createSocketIoClientAdapter } from '@tsio/socketio/client'
import { createSocketIoServerAdapter } from '@tsio/socketio/server'
import { Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket } from 'socket.io-client'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { z } from 'zod'

const c = initContract()
const contract = c.actions({
  actions: {
    sendMessage: {
      input: z.object({ message: z.string() }),
    },
  },
  listeners: {
    onMessageReceived: {
      data: z.object({ newMessage: z.string() }),
    },
  },
})

const s = initTsIo({}, contract)
const sendMessageAction = s.action('sendMessage').handler(vi.fn())
const router = s.router({
  sendMessage: sendMessageAction,
})

describe('client', () => {
  it('infers action types correctly', () => {
    const adapter = createSocketIoServerAdapter(mock<ServerSocket>())
    attachTsIoToWebSocket(router, adapter)

    const clientAdapter = createSocketIoClientAdapter(mock<ClientSocket>())

    const client = initNewClient(clientAdapter, contract)

    expect(client.actions.sendMessage).toBeDefined()
    expectTypeOf(client.actions.sendMessage).parameter(0).toMatchTypeOf<{ message: string }>()
  })

  it('infers listeners types correctly', () => {
    const adapter = createSocketIoServerAdapter(mock<ServerSocket>())
    attachTsIoToWebSocket(router, adapter)

    const clientAdapter = createSocketIoClientAdapter(mock<ClientSocket>())

    const client = initNewClient(clientAdapter, contract)

    expect(client.listeners.onMessageReceived).toBeDefined()
    expectTypeOf(client.listeners.onMessageReceived)
      .parameter(0)
      .toEqualTypeOf<(response: { newMessage: string }) => void>()
    expectTypeOf(client.listeners.onMessageReceived).parameter(0).returns.toEqualTypeOf<void>()
  })
})
