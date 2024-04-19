import { type IoAction, type TsIoServerAdapter, type TsIoServerEmitter } from '@ts-io/core'
import { Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

type TsIoScoketIoSocket = Socket & { id?: string }

function createSocketIoServerAdapter<Action extends IoAction>(
  socket: TsIoScoketIoSocket
): TsIoServerAdapter<Action> {
  const emitToClient: TsIoServerEmitter = (socketId, response) => {
    const { event, data } = response
    // @FIXME: BROADCAST TO ALL CLIENTS FOR TESTING PURPOSES
    // socket.broadcast.emit(event, data)
    socket.to(socketId).emit(event, data)
  }

  return {
    emitTo: (event, to, data) => {
      const messageId = uuidv4()
      const response = { messageId, event, data }
      emitToClient(to, response)
    },
    on: (event, handler) => {
      socket.on(event as string, async (data, callback) => {
        const response = await handler(data)

        if (typeof response === 'object') {
          callback({ data: response })
        }
      })
    },
  }
}

export { createSocketIoServerAdapter }
