import React, { useEffect, useState } from 'react'
import type { Group, UserProfile } from '../types'
import { api } from '../utils/api'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { useChat } from './ChatProvider/ChatProvider'

type Props = { user: UserProfile; onLoggedOut: () => void }

async function logOut() {
  const res = await api<boolean>('/api/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Ensure cookies are included with the request
  })

  if (!res.success) {
    console.error('Logout failed:', res.error)
    return
  }

  return true
}

export function SideBar({ user, onLoggedOut }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)
  const chat = useChat()

  useEffect(() => {
    async function getChats() {
      setLoadingChats(true)
      const res = await api<Group[]>('http://localhost:3010/api/chats', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (!res.success) {
        console.error('Error fetching users list', res.error)
      } else {
        chat.dispatch({ type: 'INIT', payload: { chats: res.data } })
      }
      setLoadingChats(false)
    }

    getChats()
  }, [user])

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const loggedOut = await logOut()
    if (loggedOut) {
      onLoggedOut()
    }
  }

  const handleConversationClicked =
    (chatKey: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      chat.dispatch({ type: 'OPEN_CHAT', payload: { chatKey } })
    }

  return (
    <div className="flex flex-col py-6 pl-6 w-1/3 lg:w-1/4 xl:1/ flex-shrink-0 h-dvh">
      <div className="flex flex-row items-center justify-center h-12 w-full">
        <div className="ml-2 font-bold text-2xl text-white">Playground</div>
      </div>
      <div className="flex flex-col bg-white mt-4 rounded-2xl h-full w-full shadow-sm">
        <div className="flex flex-col items-center bg-indigo-100 border border-gray-200 py-6 px-4 rounded-lg gap-y-4">
          <div className="flex flex-col items-center justify-center">
            <Avatar nickname={user.nickname} size="lg" />
            <div className="text-lg font-bold mt-2 first-letter:uppercase">{user.nickname}</div>
          </div>
          <Button onClick={handleLogout} className="text-sm py-1 px-2 font-semibold">
            Logout
          </Button>
        </div>

        <div className="flex-1 flex flex-col mt-8 overflow-y-auto overflow-x-hidden px-4">
          <div className="flex flex-row items-center justify-between text-xs">
            <span className="font-semibold text-lg">People</span>
            <span className="flex items-center justify-center bg-gray-300 h-4 w-4 rounded-full">
              {Object.keys(chat.state.chats).length}
            </span>
          </div>
          <div className="flex-1 flex flex-col space-y-1 mt-4 -mx-2">
            {Object.values(chat.state.chats).map(c => {
              const otherUser = c.users.find(u => u.id !== user.id)
              if (!otherUser) return null
              return (
                <button
                  key={c.id}
                  onClick={handleConversationClicked(c.id)}
                  className="flex flex-row items-center hover:bg-gray-100 rounded-xl p-2"
                >
                  <Avatar size="sm" nickname={otherUser.nickname} />
                  <div className="ml-2 text-sm font-semibold first-letter:uppercase">
                    {otherUser.nickname}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
