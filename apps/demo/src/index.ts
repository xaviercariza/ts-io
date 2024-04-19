import { initContract, initTsIo } from '@ts-io/core'
import { z } from 'zod'
import { createIoServer, createSockets } from './utils'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
})

const c = initContract()
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

type User = { id: string; name: string }
type TestContext = { user: User | null }
const initialContext: TestContext = { user: null }

const s = initTsIo(initialContext, postContract)

const reusableMiddleware = s.middleware(opts => {
  return opts.next({
    ctx: { test: 'pepe', user: { id: '1', name: 'Clara' } },
  })
})
const reusableMiddleware2 = s.middleware(opts => {
  return opts.next({
    ctx: { test2: 22222, user: { id: '1', name: 'Xavier' } },
  })
})

const createPostAction = s
  .action('createPost')
  .use(opts => {
    console.log(`*** Action "${opts.path}" ***`)
    return opts.next()
  })
  .use(reusableMiddleware)
  .use(reusableMiddleware2)
  .use(opts => {
    const user = opts.ctx.user

    if (!user) {
      throw new Error('Unauthorized')
    }

    return opts.next({
      ctx: {
        user,
      },
    })
  })
  .handler(({ input, emitEventTo }) => {
    const newPost = {
      id: '1',
      title: input.title,
      body: input.body,
    }

    emitEventTo('onPostCreated', 'room-1', newPost)

    return { success: true, data: newPost }
  })

const router = s.router({
  createPost: createPostAction,
})

const run = async () => {
  const io = createIoServer()
  const { clientSocket: emitterClientSocket, tsIoClient: emitterTsIoClient } = await createSockets(
    io,
    postContract,
    router
  )
  const {
    clientSocket: listenerClientSocket,
    tsIoClient: listenerTsIoClient,
    serverSocket: listenerServerSocket,
  } = await createSockets(io, postContract, router)
  listenerServerSocket.join('room-1')

  listenerTsIoClient.listeners.onPostCreated(data => {
    console.log('ON POST CREATED!!!!!!', data)
  })

  const response = await emitterTsIoClient.actions.createPost({
    title: 'First post',
    body: 'This is the body',
  })
  if (response.success) {
    console.log('Post created: ', response.data)
  } else {
    console.error('Error creating post', response.error)
  }

  io.close()
  emitterClientSocket.close()
  listenerClientSocket.close()
  // const result = await router.createPost({
  //   path: 'createPost',
  //   input: {
  //     title: 'Post title',
  //     body: 'Post body',
  //   },
  // })
  // console.log('Result: ', result)
}

run()

// import { initContract, initTsIo, initTsIoServer } from '@ts-io/core'
// import { z } from 'zod'
// import { createIoServer, createSockets } from './utils'

// const c = initContract()

// const PostSchema = z.object({
//   id: z.string(),
//   title: z.string(),
//   body: z.string(),
// })

// const postContract = c.actions({
//   actions: {
//     createPost: {
//       input: PostSchema.omit({ id: true }),
//       response: PostSchema,
//     },
//     updatePost: {
//       input: PostSchema.pick({ id: true }),
//       response: PostSchema,
//     },
//   },
//   listeners: {
//     onPostCreated: {
//       data: PostSchema,
//     },
//   },
// })

// type Context = {
//   isAuthenticated: boolean
//   user?:
//     | {
//         id: string
//         name: string
//       }
//     | null
//     | undefined
// }

// const initialContext: Context = {
//   isAuthenticated: false,
//   user: null,
// }

// const s = initTsIo(initialContext, postContract)
// const postActions = s.createActions({
//   createPost: {
//     middlewares: [
//       (ctx, next) => {
//         console.log('logger function:', ctx)
//         return next()
//       },
//       (ctx, next) => {
//         console.log('Fetching user data middleware:', ctx)
//         return next({ ...ctx, user: { id: '1', name: 'pepe' } })
//       },
//       (ctx, next) => {
//         ctx.user.name
//         console.log('Is authenticated middleware:', ctx)

//         if (!ctx.user) {
//           throw new Error('User not found')
//         }

//         return next({ ...ctx, isAuthenticated: true })
//       },
//     ],
//     handler: ({ ctx, input, emitEventTo }) => {
//       const { title, body } = input
//       const newPost = {
//         id: 'post-1',
//         title,
//         body,
//       }

//       emitEventTo('onPostCreated', 'room-1', newPost)

//       return { success: true, data: newPost }
//     },
//   },
//   updatePost: {
//     middlewares: [
//       (ctx, next) => {
//         console.log(ctx)
//         return next()
//       },
//     ],
//     handler({ ctx, input }) {
//       const newPost = {
//         id: input.id,
//         title: 'Title updated',
//         body: 'Body updated',
//       }
//       return { success: true, data: newPost }
//     },
//   },
// })
// async function execute() {
//   const io = createIoServer()
//   const { clientSocket: emitterClientSocket, tsIoClient: emitterTsIoClient } = await createSockets(
//     io,
//     postContract,
//     postActions
//   )
//   const {
//     clientSocket: listenerClientSocket,
//     tsIoClient: listenerTsIoClient,
//     serverSocket: listenerServerSocket,
//   } = await createSockets(io, postContract, postActions)
//   listenerServerSocket.join('room-1')

//   listenerTsIoClient.listeners.onPostCreated(data => {
//     console.log('ON POST CREATED!!!!!!', data)
//   })

//   const response = await emitterTsIoClient.actions.createPost({
//     title: 'First post',
//     body: 'This is the body',
//   })
//   if (response.success) {
//     console.log('Post created: ', response.data)
//   } else {
//     console.error('Error creating post', response.error)
//   }

//   io.close()
//   emitterClientSocket.close()
//   listenerClientSocket.close()
// }

// execute()
