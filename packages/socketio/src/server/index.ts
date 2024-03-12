import { type IoContract, type TsIoServerAdapter, type TsIoServerEmitter } from '@ts-io/core'
import { Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

type TsIoScoketIoSocket = Socket & { id?: string }

function createSocketIoServerProxy<Contract extends IoContract>(
  socket: TsIoScoketIoSocket
): TsIoServerAdapter<Contract> {
  const emitToClient: TsIoServerEmitter = (socketId, response) => {
    const { event, data } = response
    // @FIXME: BROADCAST TO ALL CLIENTS FOR TESTING PURPOSES
    // socket.broadcast.emit(event, data)
    socket.to(socketId).emit(event, data)
  }

  return {
    emitTo: (to, event, data) => {
      const messageId = uuidv4()
      const response = { messageId, event, data }
      emitToClient(to, response)
    },
    // acknowledge: output => {
    //   return output
    // },
    on: (event, handler) => {
      socket.on(event as string, (data, callback) => {
        handler(data, output => {
          callback({ data: output })
        })
      })
    },
  }
}

export { createSocketIoServerProxy }
