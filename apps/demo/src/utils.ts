import {
  InferContractActions,
  InferContractListeners,
  IoContract,
  applySocketActions,
} from '@ts-io/core'
import { createServer } from 'http'
import { Server, Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket, io as ioc } from 'socket.io-client'
import { type InferServerActions } from '@ts-io/core'

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
  InferContractActions<Contract>,
  InferContractListeners<Contract>
>
type TClientSocket<Contract extends IoContract> = ClientSocket<
  InferContractListeners<Contract>,
  InferContractActions<Contract>
>

type TestSockets<Contract extends IoContract> = {
  clientSocket: TClientSocket<Contract>
  serverSocket: TServerSocket<Contract>
}
async function createSockets<Contract extends IoContract>(
  io: Server,
  contract: Contract,
  actions: InferServerActions<Contract>
): Promise<TestSockets<Contract>> {
  const clientSocket: TClientSocket<Contract> = ioc(`ws://localhost:${PORT}`, {
    transports: ['websocket'],
  })

  let serverSocket: TServerSocket<Contract> | undefined = undefined
  io.on('connection', connectedSocket => {
    serverSocket = connectedSocket
    applySocketActions(contract, actions, connectedSocket)
  })

  await waitForClientToReceiveEvent(clientSocket, 'connect')

  if (!serverSocket) {
    throw new Error('Server socket not correctly initialized')
  }

  if (!clientSocket) {
    throw new Error('Client socket not correctly initialized')
  }

  return { clientSocket, serverSocket }
}

function createIoServer(): Server {
  const httpServer = createServer()
  const io = new Server(httpServer)
  httpServer.listen(PORT)

  return io
}

export { createIoServer, createSockets }
