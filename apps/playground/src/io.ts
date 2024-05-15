import { createSocketIoServerAdapter } from '@tsio/socketio/server'
import { Server } from 'socket.io'
import { tsIo } from './libs/tsio/tsio'
import { router } from './libs/tsio/router'

const createIOServer = (server: any) => {
  const io = new Server(server)

  io.on('connection', socket => {
    console.log(`A user connected ${socket.id}`)

    const adapter = createSocketIoServerAdapter(socket)
    tsIo.attachRouterToSocket(router, adapter)

    socket.on('disconnect', () => {
      console.log(`user disconnected ${socket.id}`)
    })
  })
}

export { createIOServer }
