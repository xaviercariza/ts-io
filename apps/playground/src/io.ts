import { createSocketIoServerAdapter } from '@tsio/socketio/server'
import type express from 'express'
import type http from 'node:http'
import { Server } from 'socket.io'
import { chatRouter } from './server/tsio/router'
import { attachRouterToSocket } from './server/tsio/tsio'
import { connectUser, disconnectUser } from './server/services'

const createIOServer = (server: http.Server, sessionMiddleware: express.RequestHandler) => {
  const io = new Server(server)
  io.engine.use(sessionMiddleware)

  io.on('connection', async socket => {
    const user = socket.request.session?.user ?? null

    if (user) {
      await connectUser(user.id, socket.id)

      console.log(`A user connected ${socket.id}`)

      const adapter = createSocketIoServerAdapter(socket)
      attachRouterToSocket(chatRouter, adapter, () => ({ user }))

      socket.on('disconnect', async () => {
        console.log(`user disconnected ${socket.id}`)
        await disconnectUser(user.id)
      })
    }
  })
}

export { createIOServer }
