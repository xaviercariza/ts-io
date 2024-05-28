import { type Server, createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  type ContractPaths,
  type ContractRouterType,
  type TsIoClient,
  type TsIoServerAdapter,
  initNewClient,
} from '@tsio/core'
import { createSocketIoClientAdapter } from '@tsio/socketio/client'
import { createSocketIoServerAdapter } from '@tsio/socketio/server'
import { Server as IoServer, type Socket as TServerSocket } from 'socket.io'
import { type Socket as TClientSocket, io as ioc } from 'socket.io-client'

function waitForSocketIoClientToReceiveEvent<Contract extends ContractRouterType>(
  clientSocket: TClientSocket<any>,
  event: ContractPaths<Contract, 'listener'> | 'connect'
) {
  return new Promise<any>(resolve => {
    clientSocket.on(event as any, resolve)
  })
}

function waitForSocketIoServerToReceiveEvent<Contract extends ContractRouterType>(
  serverSocket: TServerSocket<Contract> | undefined,
  event: ContractPaths<Contract, 'action'>
) {
  return new Promise<any>(resolve => {
    serverSocket?.on(event as any, resolve)
  })
}

type SocketsSetup<Contract extends ContractRouterType> = {
  io: IoServer
  server: {
    socket: TServerSocket<Contract>
    adapter: TsIoServerAdapter<any>
  }
  client: {
    socket1: {
      socket: TClientSocket<Contract>
      client: TsIoClient<Contract>
    }
    socket2: {
      socket: TClientSocket<Contract>
      client: TsIoClient<Contract>
    }
  }
}

async function initializeTsIo<Contract extends ContractRouterType>(
  io: IoServer
): Promise<{ socket: TServerSocket<Contract>; adapter: TsIoServerAdapter<any> }> {
  return new Promise(resolve => {
    io.on('connection', socket => {
      const adapter = createSocketIoServerAdapter(socket)
      resolve({ socket, adapter })
    })
  })
}

async function createSockets<Contract extends ContractRouterType>(
  httpServer: Server,
  contract: Contract
) {
  const io = new IoServer(httpServer)
  const port = (httpServer.address() as AddressInfo).port

  const socket1 = ioc(`http://localhost:${port}`, { forceNew: true })
  const socket2 = ioc(`http://localhost:${port}`, { forceNew: true })

  const server = await initializeTsIo(io)

  await waitForSocketIoClientToReceiveEvent(socket1, 'connect')
  await waitForSocketIoClientToReceiveEvent(socket2, 'connect')

  const socket1ClientAdapter = createSocketIoClientAdapter(socket1)
  const socket1Client = initNewClient(socket1ClientAdapter, contract)

  const socket2ClientAdapter = createSocketIoClientAdapter(socket2)
  const socket2Client = initNewClient(socket2ClientAdapter, contract)

  return {
    io,
    server,
    client: {
      socket1: {
        socket: socket1,
        client: socket1Client,
      },
      socket2: {
        socket: socket2,
        client: socket2Client,
      },
    },
  }
}

async function setupSocketIo<Contract extends ContractRouterType>(contract: Contract) {
  const httpServer = createServer()

  const setup = await new Promise<SocketsSetup<Contract>>(resolve => {
    httpServer.listen(async () => {
      const sockets = await createSockets(httpServer, contract)
      resolve(sockets)
    })
  })

  function closeConnections() {
    setup.io.close()
    setup.client.socket1.socket.disconnect()
    setup.client.socket2.socket.disconnect()
  }

  return { setup, closeConnections }
}

export { setupSocketIo, waitForSocketIoClientToReceiveEvent, waitForSocketIoServerToReceiveEvent }
