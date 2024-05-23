import express from 'express'
import session from 'express-session'
import http from 'node:http'
import { createServer as createViteServer } from 'vite'
import { createIOServer } from './io'
import { getAllUser, getChats, getUser, searchUserChats, signIn } from './server/services'

const port = 3010

async function createMainServer() {
  const app = express()
  const server = http.createServer(app)

  const sessionMiddleware = session({
    secret: 'changeit',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })

  app.use(sessionMiddleware)
  app.use(express.json())

  app.get('/health', (req, res) => {
    return res.send('Ok')
  })
  app.post('/api/login', async (req, res) => {
    const { nickname, password } = req.body
    const result = await signIn(nickname, password)
    if (!result.success) {
      return res.status(result.code).send(result.error)
    }
    if (req.session) {
      req.session.user = result.data
    }
    return res.status(200).send(result.data)
  })
  app.post('/api/logout', (req, res) => {
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).send('Failed to log out')
        }
        return res.send(true)
      })
    }
  })
  app.get('/api/session', (req, res) => {
    if (req.session?.user) {
      return res.send(req.session.user)
    }
    return res.status(401).send({ loggedIn: false })
  })
  app.post('/api/nickname', async (req, res) => {
    const { nickname } = req.body
    const user = await getUser(nickname)
    res.send(!user)
  })
  app.get('/api/chats', async (req, res) => {
    if (!req.session || !req.session.user) {
      return res.status(401).send('Unauthorized, please sign in')
    }

    const result = await getChats(req.session.user.id)
    if (!result.success) {
      return res.send([])
    }
    res.send(result.data)
  })
  app.get('/api/users', async (req, res) => {
    if (!req.session || !req.session.user) {
      return res.status(401).send('Unauthorized, please sign in')
    }
    const result = await getAllUser(req.session.user.nickname)
    if (!result.success) {
      return res.send([])
    }
    res.send(result.data)
  })
  app.get('/api/users/:search', async (req, res) => {
    if (!req.session || !req.session.user) {
      return res.status(401).send('Unauthorized, please sign in')
    }

    const { search } = req.params

    const results = await searchUserChats(search as string)
    if (!results.success) {
      return res.send([])
    }
    res.send(results.data)
  })

  createIOServer(server, sessionMiddleware)

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server,
      },
    },
    appType: 'spa',
  })

  app.use(vite.middlewares)
  app.use(express.static('static'))

  server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}

createMainServer()
