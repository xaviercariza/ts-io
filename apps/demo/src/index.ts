// Import stylesheets
import { initClient, initContract, initServer } from '@ts-io/core'
import { z } from 'zod'
import { createIoServer, createSockets } from './utils'

const c = initContract()

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
})

const postContract = c.actions({
  actions: {
    createPost: {
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
  },
  listeners: {
    onPostCreated: {
      data: PostSchema,
    },
  },
})

const s = initServer({
  userPlayerId: 'user -1',
})

const postActions = s.actions(postContract, {
  createPost: {
    handler: ({ input, emitEventTo }) => {
      const { title, body } = input
      const newPost = {
        id: 'post-1',
        title,
        body,
      }

      emitEventTo('onPostCreated', 'room-1', newPost)

      return { success: true, data: newPost }
    },
  },
})

async function execute() {
  const io = createIoServer()
  const { clientSocket: emitterClientSocket } = await createSockets(io, postContract, postActions)
  const { clientSocket: listenerClientSocket, serverSocket: listenerServerSocket } =
    await createSockets(io, postContract, postActions)
  listenerServerSocket.join('room-1')

  const emitterClient = initClient(emitterClientSocket, postContract)
  const listenerClient = initClient(listenerClientSocket, postContract)

  listenerClient.listeners.onPostCreated(data => {
    console.log('ON POST CREATED!!!!!!', data)
  })

  const response = await emitterClient.actions.createPost({
    title: 'First post',
    body: 'This is the body',
  })
  if (response.success) {
    console.log('Post created: ', response.data)
  } else {
    ;[console.error('Error creating post', response.error)]
  }

  io.close()
  emitterClientSocket.close()
  listenerClientSocket.close()
}

execute()
