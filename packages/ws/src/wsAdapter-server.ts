import { TsIoServerAdapter, TsIoServerEmitter } from '@ts-io/core'
import { type IoContract } from '@ts-io/core'
import { v4 as uuidv4 } from 'uuid'
import ws, { WebSocketServer } from 'ws'

export type TsIoWebSocket = ws.WebSocket & { id?: string }

type TsIoWebSocketServer = Omit<WebSocketServer, 'clients'> & {
  clients: Set<TsIoWebSocket>
}

function createWsServerProxy<Contract extends IoContract>(
  wsServer: TsIoWebSocketServer,
  socket: TsIoWebSocket
): TsIoServerAdapter<Contract> {
  const emitToClient: TsIoServerEmitter = (to, data) => {
    wsServer.clients.forEach(ws => {
      // @FIXME: BROADCAST TO ALL CLIENTS FOR TESTING PURPOSES
      if (/* ws.id === socketId &&  */ socket.readyState === socket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    })
  }

  return {
    emitTo: (to, event, data) => {
      const messageId = uuidv4()
      emitToClient(to, { messageId, event, data })
    },
    // acknowledge: output => {
    //   wsServer.clients.forEach(ws => {
    //     if (socket.id === ws.id && socket.readyState === socket.OPEN) {
    //       ws.send(JSON.stringify(output))
    //     }
    //   })
    // },
    on: (eventKey, handler) => {
      socket.on('message', msg => {
        const { messageId, event, data } = JSON.parse(msg.toString())
        if (event === eventKey) {
          handler(data, response => {
            wsServer.clients.forEach(ws => {
              if (socket.id === ws.id && socket.readyState === socket.OPEN) {
                ws.send(JSON.stringify({ messageId, event, data: response }))
              }
            })
          })
        }
      })
    },
  }
}

export { createWsServerProxy }
