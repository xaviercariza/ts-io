import { initNewClient } from '@tsio/core'
import { createSocketIoClientAdapter } from '@tsio/socketio/client'
import { io } from 'socket.io-client'
import { chatContract } from './contract'

document.addEventListener('DOMContentLoaded', () => {
  const socket = io()

  const adapter = createSocketIoClientAdapter(socket)
  const client = initNewClient(adapter, chatContract)

  const form = document.getElementById('form')
  const input = document.getElementById('input') as HTMLInputElement
  const messages = document.getElementById('messages') as HTMLUListElement

  form?.addEventListener('submit', async e => {
    e.preventDefault()
    if (input.value.trim()) {
      await client.actions.chat.sendMessage({ message: input.value })
      input.value = ''
    }
  })

  client.listeners.chat.onMessageReceived(msg => {
    const item = document.createElement('li')
    item.textContent = msg.message
    messages.appendChild(item)
    window.scrollTo(0, document.body.scrollHeight)
  })
})
