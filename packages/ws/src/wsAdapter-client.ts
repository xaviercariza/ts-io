import { type IoContract, type TsIoClientAdapter } from '@ts-io/core'
import WebSocket from 'ws'

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function createWsClientProxy<Contract extends IoContract>(
  socket: WebSocket
): TsIoClientAdapter<Contract> {
  const requestCallbacks: Map<keyof Contract['actions'], (data: any) => void> = new Map()
  const eventsCallbacks: Map<keyof Contract['listeners'], (data: any) => void> = new Map()

  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data.toString())
    const messageId = data.messageId

    if (requestCallbacks.has(messageId)) {
      const callback = requestCallbacks.get(messageId)
      if (callback) {
        requestCallbacks.delete(messageId)
        callback(data)
      }
    }

    if (eventsCallbacks.has(data.event)) {
      const callback = eventsCallbacks.get(data.event)
      if (callback) {
        callback(data)
      }
    }
  })

  return {
    emit: (event, payload, callback) => {
      const messageId = generateRequestId()
      const timeout = setTimeout(() => {
        requestCallbacks.delete(messageId)
        callback?.({ success: false, error: 'Request timed out' })
      }, 5000)

      requestCallbacks.set(messageId, (response: any) => {
        clearTimeout(timeout)
        callback?.(response.data)
      })

      socket.send(JSON.stringify({ messageId, event, data: payload }))
    },
    on: (event, callback) => {
      eventsCallbacks.set(event, (response: any) => {
        callback(response.data)
      })
    },
  }
}

export { createWsClientProxy }
