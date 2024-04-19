import {
  InferSocketActions,
  InferSocketListeners,
  IoContract,
  Router,
  TsIoClient,
  attachTsIoToWebSocket,
  initNewClient,
} from '@ts-io/core'
import { createSocketIoClientAdapter } from '@ts-io/socketio/client'
import { createSocketIoServerAdapter } from '@ts-io/socketio/server'
import { createServer } from 'http'
import { Server, Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket, io as ioc } from 'socket.io-client'

const PORT = 4000

function waitForClientToReceiveEvent<Contract extends IoContract>(
  emitter: TClientSocket<Contract>,
  event: string
) {
  return new Promise(resolve => {
    emitter.on(event as any, resolve)
  })
}

type TServerSocket<Contract extends IoContract> = ServerSocket<
  InferSocketActions<Contract>,
  InferSocketListeners<Contract>
>
type TClientSocket<Contract extends IoContract> = ClientSocket<
  InferSocketListeners<Contract>,
  InferSocketActions<Contract>
>

type TestSockets<Contract extends IoContract> = {
  serverSocket: TServerSocket<Contract>
  clientSocket: TClientSocket<Contract>
  tsIoClient: TsIoClient<Contract>
}
async function createSockets<Contract extends IoContract, TRouter extends Router<Contract>>(
  io: Server,
  contract: Contract,
  router: TRouter
): Promise<TestSockets<Contract>> {
  const clientSocket: TClientSocket<Contract> = ioc(`ws://localhost:${PORT}`, {
    transports: ['websocket'],
  })

  let serverSocket: TServerSocket<Contract> | undefined = undefined
  let tsIoClient: TsIoClient<Contract> | undefined = undefined
  io.on('connection', connectedSocket => {
    serverSocket = connectedSocket

    const serverAdapter = createSocketIoServerAdapter(connectedSocket)

    attachTsIoToWebSocket(router, serverAdapter)

    const clientAdapter = createSocketIoClientAdapter(clientSocket)
    tsIoClient = initNewClient(clientAdapter, contract)
  })

  await waitForClientToReceiveEvent(clientSocket, 'connect')

  if (!serverSocket) {
    throw new Error('Server socket not correctly initialized')
  }

  if (!clientSocket) {
    throw new Error('Client socket not correctly initialized')
  }

  if (!tsIoClient) {
    throw new Error('ts-io client socket not correctly initialized')
  }

  return { serverSocket, clientSocket, tsIoClient }
}

function createIoServer(): Server {
  const httpServer = createServer()
  const io = new Server(httpServer)
  httpServer.listen(PORT)

  return io
}

export { createIoServer, createSockets }
