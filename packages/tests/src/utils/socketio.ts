import {
  InferContractActions,
  InferContractListeners,
  IoContract,
  TsIoClient,
  TsIoServerAdapter,
  initNewClient,
} from '@ts-io/core'
import { createSocketIoClientAdapter } from '@ts-io/socketio/client'
import { createSocketIoServerAdapter } from '@ts-io/socketio/server'
import { Server, createServer } from 'node:http'
import { AddressInfo } from 'node:net'
import { Server as IoServer } from 'socket.io'
import { io as ioc } from 'socket.io-client'
import { TClientSocket, TServerSocket } from '.'

function waitForSocketIoClientToReceiveEvent<Contract extends IoContract>(
  clientSocket: TClientSocket<Contract>,
  event: keyof InferContractListeners<Contract> | 'connect'
) {
  return new Promise<any>(resolve => {
    clientSocket.on(event as any, resolve)
  })
}

function waitForSocketIoServerToReceiveEvent<Contract extends IoContract>(
  serverSocket: TServerSocket<Contract> | undefined,
  event: keyof InferContractActions<Contract>
) {
  return new Promise<any>(resolve => {
    serverSocket?.on(event as any, resolve)
  })
}

type SocketsSetup<Contract extends IoContract> = {
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

async function initializeTsIo<Contract extends IoContract>(
  io: IoServer
): Promise<{ socket: TServerSocket<Contract>; adapter: TsIoServerAdapter<any> }> {
  return new Promise(resolve => {
    io.on('connection', socket => {
      const adapter = createSocketIoServerAdapter(socket)
      resolve({ socket, adapter })
    })
  })
}

async function createSockets<Contract extends IoContract>(httpServer: Server, contract: Contract) {
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

async function setupSocketIo<Contract extends IoContract>(contract: Contract) {
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

export { setupSocketIo, waitForSocketIoServerToReceiveEvent, waitForSocketIoClientToReceiveEvent }

// import {
//   IoContract,
//   Router,
//   TsIoClient,
//   TsIoServerAdapter,
//   attachTsIoToWebSocket,
//   initNewClient,
// } from '@ts-io/core'
// import { createSocketIoClientAdapter } from '@ts-io/socketio/client'
// import { createSocketIoServerAdapter } from '@ts-io/socketio/server'
// import { Server, createServer } from 'node:http'
// import { AddressInfo } from 'node:net'
// import { Server as IoServer } from 'socket.io'
// import { io as ioc } from 'socket.io-client'
// import { TClientSocket, TServerSocket } from '.'
// import { waitForClientToReceiveEvent } from '../test-utils'

// type SocketsSetup<Contract extends IoContract> = {
//   io: IoServer
//   server: {
//     socket: TServerSocket<Contract>
//     adapter: TsIoServerAdapter<any>
//   }
//   client: {
//     socket1: {
//       socket: TClientSocket<Contract>
//       client: TsIoClient<Contract>
//     }
//     socket2: {
//       socket: TClientSocket<Contract>
//       client: TsIoClient<Contract>
//     }
//   }
// }

// async function initializeTsIo<Contract extends IoContract>(
//   io: IoServer,
//   router: Router<Contract>
// ): Promise<{ socket: TServerSocket<Contract>; adapter: TsIoServerAdapter<any> }> {
//   return new Promise(resolve => {
//     io.on('connection', socket => {
//       const adapter = createSocketIoServerAdapter(socket)
//       attachTsIoToWebSocket(router, adapter)
//       resolve({ socket, adapter })
//     })
//   })
// }

// async function createSockets<Contract extends IoContract>(
//   httpServer: Server,
//   contract: Contract,
//   router: Router<Contract>
// ) {
//   const io = new IoServer(httpServer)
//   const port = (httpServer.address() as AddressInfo).port

//   const socket1 = ioc(`http://localhost:${port}`, { forceNew: true })
//   const socket2 = ioc(`http://localhost:${port}`, { forceNew: true })

//   const server = await initializeTsIo(io, router)

//   await waitForClientToReceiveEvent(socket1, 'connect')
//   await waitForClientToReceiveEvent(socket2, 'connect')

//   const socket1ClientAdapter = createSocketIoClientAdapter(socket1)
//   const socket1Client = initNewClient(socket1ClientAdapter, contract)

//   const socket2ClientAdapter = createSocketIoClientAdapter(socket2)
//   const socket2Client = initNewClient(socket2ClientAdapter, contract)

//   return {
//     io,
//     server,
//     client: {
//       socket1: {
//         socket: socket1,
//         client: socket1Client,
//       },
//       socket2: {
//         socket: socket2,
//         client: socket2Client,
//       },
//     },
//   }
// }

// async function setupSockets<Contract extends IoContract>(
//   contract: Contract,
//   router: Router<Contract>
// ) {
//   const httpServer = createServer()

//   return await new Promise<SocketsSetup<Contract>>(resolve => {
//     httpServer.listen(async () => {
//       const sockets = await createSockets(httpServer, contract, router)
//       resolve(sockets)
//     })
//   })
// }

// export { setupSockets }
