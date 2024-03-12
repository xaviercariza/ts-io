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
    emit: (event, payload) => {
      const messageId = generateRequestId()
      const promise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          requestCallbacks.delete(messageId)
          reject(new Error('Request timed out'))
        }, 5000)

        requestCallbacks.set(messageId, (response: any) => {
          clearTimeout(timeout)
          if (response.data.success) {
            resolve(response.data.data)
          }
        })
      })

      socket.send(JSON.stringify({ messageId, event, data: payload }))

      return promise
    },
    on: (event, callback) => {
      eventsCallbacks.set(event, (response: any) => {
        callback(response.data)
      })
    },
  }
}

export { createWsClientProxy }
