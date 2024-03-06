import { InferContractActions, InferContractListeners, IoContract } from '@tsio/core'
import { Socket as ServerSocket } from 'socket.io'
import { Socket as ClientSocket } from 'socket.io-client'

type TServerSocket<Contract extends IoContract> = ServerSocket<
  InferContractActions<Contract>,
  InferContractListeners<Contract>
>
type TClientSocket<Contract extends IoContract> = ClientSocket<
  InferContractListeners<Contract>,
  InferContractActions<Contract>
>

export type { TClientSocket, TServerSocket }
