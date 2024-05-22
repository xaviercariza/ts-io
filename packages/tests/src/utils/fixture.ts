import { attachTsIoToWebSocket } from '@tsio/core'
import { test } from 'vitest'
import { setupSocketIo } from './socketio'
import { setupWs } from './ws'

type SocketsFixture = {
  socketIoFixture: {
    setupSocketIo: typeof setupSocketIo
    attachTsIoToWebSocket: typeof attachTsIoToWebSocket
  }
  wsFixture: {
    setupWs: typeof setupWs
    attachTsIoToWebSocket: typeof attachTsIoToWebSocket
  }
}

export const socketsTest = test.extend<SocketsFixture>({
  socketIoFixture: async (_, use) => {
    await use({ setupSocketIo, attachTsIoToWebSocket })
  },
  wsFixture: async (_, use) => {
    await use({ setupWs, attachTsIoToWebSocket })
  },
})
