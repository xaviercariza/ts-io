import { ContractRouterType, type TsIoClientAdapter } from '@tsio/core'
import { Socket } from 'socket.io-client'

function createSocketIoClientAdapter<Contract extends ContractRouterType>(
  socket: Socket
): TsIoClientAdapter<Contract> {
  return {
    emit: (event, payload, callback) => {
      socket.emit(event as string, payload, (response: any) => {
        if (callback) {
          callback(response.data)
        }
      })
    },
    on: (event, callback) => {
      socket.on(event as string, callback)
    },
    unsubscribe: event => {
      socket.off(event)
    },
  }
}

export { createSocketIoClientAdapter }
