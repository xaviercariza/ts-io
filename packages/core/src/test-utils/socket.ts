import { createServer } from 'http'
import { Server, Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket, io as ioc } from 'socket.io-client'
import { InferServerActions, applySocketActions } from '../server'
import { InferContractActions, InferContractListeners, IoContract } from '../types'

const PORT = 4000

type TServerSocket<Contract extends IoContract> = ServerSocket<
  InferContractActions<Contract>,
  InferContractListeners<Contract>
>
type TClientSocket<Contract extends IoContract> = ClientSocket<
  InferContractListeners<Contract>,
  InferContractActions<Contract>
>

function waitForClientToReceiveEvent<Contract extends IoContract>(
  emitter: TClientSocket<Contract>,
  event: string
) {
  return new Promise<any>(resolve => {
    emitter.on(event as any, resolve)
  })
}
function waitForServerToReceiveEvent<Contract extends IoContract>(
  emitter: ServerSocket | undefined,
  event: keyof InferContractActions<Contract>
) {
  return new Promise<any>(resolve => {
    emitter?.on(event as any, resolve)
  })
}

function setupTestServer(): Server {
  const httpServer = createServer()

  const io = new Server(httpServer)
  httpServer.listen(PORT)

  return io
}

type TestSockets<Contract extends IoContract> = {
  clientSocket: TClientSocket<Contract>
  serverSocket: TServerSocket<Contract> | undefined
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

  return { clientSocket, serverSocket }
}

export { setupTestServer, createSockets, waitForClientToReceiveEvent, waitForServerToReceiveEvent }
export type { TClientSocket, TServerSocket }
