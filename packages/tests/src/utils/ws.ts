import {
  InferContractActions,
  InferContractListeners,
  IoContract,
  TsIoClient,
  TsIoServerAdapter,
  initNewClient,
} from '@ts-io/core'
import { createWsClientProxy } from '@ts-io/ws/client'
import { TsIoWebSocket, TsIoWebSocketServer, createWsServerProxy } from '@ts-io/ws/server'
import http from 'node:http'
import { AddressInfo } from 'node:net'
import ws, { WebSocket, WebSocketServer } from 'ws'

function generateSocketIdMock(): string {
  return Math.random().toString(36).substring(2, 10)
}

function waitForWsClientToReceiveEvent<Contract extends IoContract>(
  clientSocket: ws.WebSocket,
  event: keyof InferContractListeners<Contract> | 'connect'
) {
  return new Promise<any>(resolve => {
    clientSocket.on(event as any, resolve)
  })
}

function waitForWsServerToReceiveEvent<Contract extends IoContract>(
  serverSocket: ws.WebSocket,
  event: keyof InferContractActions<Contract>
) {
  return new Promise<any>(resolve => {
    serverSocket.on(event as any, resolve)
  })
}

type SocketsSetup<Contract extends IoContract> = {
  wss: TsIoWebSocketServer
  server: {
    socket: TsIoWebSocket
    adapter: TsIoServerAdapter<any>
  }
  client: {
    socket1: {
      socket: TsIoWebSocket
      client: TsIoClient<Contract>
    }
    socket2: {
      socket: TsIoWebSocket
      client: TsIoClient<Contract>
    }
  }
}

type WsServer = {
  socket: TsIoWebSocket
  adapter: TsIoServerAdapter<any>
}
async function initializeTsIo(wss: TsIoWebSocketServer): Promise<WsServer> {
  return await new Promise(resolve => {
    wss.on('connection', (socket, req) => {
      const uuid = req.url?.replace('/?uuid=', '')

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      socket.id = uuid
      // const socket = { ...ws, id: uuid } as TsIoWebSocket
      const adapter = createWsServerProxy(wss, socket)

      function onSocketPostError(e: Error) {
        console.log('onSocketPostError: ', e)
      }

      socket.on('error', onSocketPostError)
      // socket.on('close', () => {
      //   console.log('Connection closed')
      // })

      resolve({
        socket,
        adapter,
      })
    })
  })
}

function waitForSocketState(socket: WebSocket, state: number) {
  return new Promise<void>(function (resolve) {
    setTimeout(function () {
      if (socket.readyState === state) {
        resolve()
      } else {
        waitForSocketState(socket, state).then(resolve)
      }
    }, 5)
  })
}

async function createClientSocket<Contract extends IoContract>(contract: Contract, port: number) {
  const uuid = generateSocketIdMock()
  const socket = new WebSocket(`ws://localhost:${port}/?uuid=${uuid}`) as TsIoWebSocket

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  socket.id = uuid

  const adapter = createWsClientProxy(socket)
  const client = initNewClient(adapter, contract)

  // socket.onopen = () => console.log('WebSocket connection established')
  // socket.onclose = () => console.log('WebSocket connection closed')
  // socket.onerror = () => console.log('WebSocket error')

  socket.emit('connection')

  return { socket, adapter, client }
}

async function createSockets<Contract extends IoContract>(
  httpServer: http.Server,
  contract: Contract
) {
  const wss = new WebSocketServer({ noServer: true }) as TsIoWebSocketServer
  const port = (httpServer.address() as AddressInfo).port

  const socket1 = await createClientSocket(contract, port)
  // await waitForSocketState(socket1.socket, socket1.socket.OPEN)
  const socket2 = await createClientSocket(contract, port)
  // await waitForSocketState(socket2.socket, socket2.socket.OPEN)

  function onSocketPreError(e: Error) {
    console.log('onSocketPreError: ', e)
  }

  httpServer.on('upgrade', (req, socket, head) => {
    socket.on('error', onSocketPreError)
    wss.handleUpgrade(req, socket, head, ws => {
      socket.removeListener('error', onSocketPreError)
      wss.emit('connection', ws, req)
    })
  })

  const server = await initializeTsIo(wss)

  await waitForSocketState(socket1.socket, socket1.socket.OPEN)
  await waitForSocketState(socket2.socket, socket2.socket.OPEN)

  return {
    wss,
    server,
    client: {
      socket1,
      socket2,
    },
  }
}

async function setupWs<Contract extends IoContract>(contract: Contract) {
  const httpServer = http.createServer()

  const setup = await new Promise<SocketsSetup<Contract>>(resolve => {
    httpServer.listen(async () => {
      const sockets = await createSockets(httpServer, contract)
      resolve(sockets)
    })
  })

  function closeConnections() {
    setup.wss.close()
    setup.client.socket1.socket.close()
    setup.client.socket2.socket.close()
  }

  return { setup, closeConnections }
}

export { setupWs, waitForWsClientToReceiveEvent, waitForWsServerToReceiveEvent }
