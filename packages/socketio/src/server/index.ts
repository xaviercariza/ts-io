import { ContractAction, type TsIoServerAdapter, type TsIoServerEmitter } from '@tsio/core'
import { Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

type TsIoScoketIoSocket = Socket & { id?: string }

function createSocketIoServerAdapter<Action extends ContractAction>(
  socket: TsIoScoketIoSocket
): TsIoServerAdapter<Action> {
  const emitToClient: TsIoServerEmitter = (socketId, response) => {
    const { event, data } = response
    socket.broadcast.emit(event, data)
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
