import type { TsIoClient } from '@tsio/core'
import { initNewClient } from '@tsio/core'
import { createSocketIoClientAdapter } from '@tsio/socketio/client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import { chatContract } from '../libs/tsio/contract'

interface ChatSocketCtxState {
  tsIo: TsIoClient<typeof chatContract> | null
}

const TsIoCtx = createContext<ChatSocketCtxState>({} as ChatSocketCtxState)

export function TsIoProvider({ children }: { children: ReactNode }) {
  const [tsIoClient] = useState<TsIoClient<typeof chatContract>>(() => {
    const socket = io({ transports: ['websocket'] })
    const adapter = createSocketIoClientAdapter(socket)
    return initNewClient(adapter, chatContract)
  })
  // const socket = useRef<Socket | null>(io({ transports: ['websocket'], autoConnect: false }))
  // const tsIoClient = useMemo(() => {
  //   if (socket.current) {
  //     const adapter = createSocketIoClientAdapter(socket.current)
  //     return initNewClient(adapter, chatContract)
  //   }
  // }, [])
  // const tsIoClient = useRef<TsIoClient<typeof chatContract> | null>(null)
  // const [tsIoClient, setTsIoClient] = useState<TsIoClient<typeof chatContract> | null>(null)

  // useEffect(() => {
  //   const socketInstance = socket.current
  //   socketInstance?.connect()
  //   // const socket = io({ transports: ['websocket'] })
  //   // const adapter = createSocketIoClientAdapter(socket)
  //   // setTsIoClient(initNewClient(adapter, chatContract))

  //   return () => {
  //     socketInstance?.disconnect()
  //   }
  // }, [])

  return <TsIoCtx.Provider value={{ tsIo: tsIoClient }}>{children}</TsIoCtx.Provider>
}

export const useTsIo = () => {
  const context = useContext(TsIoCtx)
  if (!context) {
    throw new Error('useTsIo must be used within a TsIoProvider')
  }
  return context.tsIo
}
