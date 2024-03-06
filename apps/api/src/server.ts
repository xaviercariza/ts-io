import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'

import bodyParser from 'body-parser'
import express from 'express'
import { Server } from 'socket.io'
import { applySocketActions, initServer } from '@ts-io/core'
import { postContract } from '@ts-io/utils'

dotenv.config()

type ClientToServerEvents = {
  ping: () => void
}
type ServerToClientEvents = {
  pong: () => void
}

const app = express()
const server = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents, any, { userPlayerId: string }>(
  server,
  {
    cors: {
      origin: ['http://localhost:5173'],
      methods: ['GET', 'POST'],
    },
  }
)

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

io.on('connection', async socket => {
  console.log(`Client connected ${io.sockets.sockets.size}`)

  const s = initServer()
  const postActions = s.actions(postContract, {
    createPost: {
      handler({ input }) {
        const newPost = {
          id: 'post-1',
          title: input.title,
          description: input.description,
        }

        console.log('Creating new post without response', JSON.stringify(newPost, null, 2))
      },
    },
  })
  applySocketActions(postContract, postActions, socket)

  socket.on('disconnect', async reason => {
    socket.disconnect()

    console.log(`Client disconnected ${io.sockets.sockets.size}`)
    console.log(`Reason: ${reason}`)
  })
})

const API_PORT = process.env.API_PORT || 4000

server.listen(API_PORT, function () {
  console.log(`Listening on port ${API_PORT}`)
})
