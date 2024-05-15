import { initNewClient, type TsIoClient } from '@tsio/core'
import { createSocketIoClientAdapter } from '@tsio/socketio/client'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { io } from 'socket.io-client'
import { chatContract, type MessageType } from '../libs/tsio/contract'

function App() {
  const tsIoClient = useRef<TsIoClient<typeof chatContract> | null>(null)
  const [messageValue, setMessageValue] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])

  useEffect(() => {
    const socket = io({ transports: ['websocket'] })

    const adapter = createSocketIoClientAdapter(socket)
    tsIoClient.current = initNewClient(adapter, chatContract)
    tsIoClient.current.listeners.chat.onMessageReceived(msg => {
      setMessages(prev => [...prev, msg])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (tsIoClient.current && messageValue.trim()) {
      const message = await tsIoClient.current.actions.chat.sendMessage({ message: messageValue })
      if (message.success) {
        setMessages(prev => [...prev, message.data])
        setMessageValue('')
      }
    }
  }

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setMessageValue(e.target.value)
  }

  return (
    <div>
      <ul>
        {messages.map(msg => (
          <li key={msg.id}>{msg.message}</li>
        ))}
      </ul>
      <form id="form" onSubmit={handleSendMessage}>
        <input value={messageValue} onChange={handleMessageChange} autoComplete="off" />
        <button>Send</button>
      </form>
    </div>
  )
}

export default App
