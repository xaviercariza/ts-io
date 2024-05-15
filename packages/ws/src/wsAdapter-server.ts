import { ContractAction, TsIoServerAdapter, TsIoServerEmitter } from '@tsio/core'
import { v4 as uuidv4 } from 'uuid'
import ws, { WebSocketServer } from 'ws'

export type TsIoWebSocket = ws.WebSocket & { id?: string }

export type TsIoWebSocketServer = Omit<WebSocketServer, 'clients'> & {
  clients: Set<TsIoWebSocket>
}

function createWsServerProxy<Action extends ContractAction>(
  wsServer: TsIoWebSocketServer,
  socket: TsIoWebSocket
): TsIoServerAdapter<Action> {
  const emitToClient: TsIoServerEmitter = (to, data) => {
    wsServer.clients.forEach(ws => {
      if (socket.readyState === socket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    })
  }

  return {
    emitTo: (event, to, data) => {
      const messageId = uuidv4()
      emitToClient(to, { messageId, event, data })
    },
    on: (eventKey, handler) => {
      socket.on('message', async msg => {
        const { messageId, event, data } = JSON.parse(msg.toString())
        if (event === eventKey) {
          const response = await handler(data)
          if (typeof response === 'object') {
            wsServer.clients.forEach(ws => {
              if (socket.id === ws.id && socket.readyState === socket.OPEN) {
                ws.send(JSON.stringify({ messageId, event, data: response }))
              }
            })
          }
        }
      })
    },
  }
}

export { createWsServerProxy }
