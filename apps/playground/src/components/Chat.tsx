import type React from 'react'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useUserIsTyping } from '../hooks/useUserTyping'
import type { UserProfile } from '../types'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Card } from './Card'
import { useChat } from './ChatProvider/ChatProvider'
import { Header } from './Header'
import { Input } from './Input'
import { SearchAction } from './SearchAction'
import { Spinner } from './Spinner'
import { useTsIo } from './TsIoProvider'

type Props = { user: UserProfile }

export function Chat({ user }: Props) {
  const tsIo = useTsIo()
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const chat = useChat()
  const [text, setText] = useState('')
  const { userTyping } = useUserIsTyping(chat.state.activeChat?.id, user.id, !!text)
  const [sendingMessage, setSendingMessage] = useState(false)
  const otherUser = chat.state.activeChat?.users?.find(u => u.id !== user.id)

  useEffect(() => {
    if (chat.state.activeChat?.messages?.length && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        behavior: 'smooth',
        top: messagesContainerRef.current.scrollHeight,
      })
    }
  }, [chat.state.activeChat?.messages])

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setText(e.target.value)
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const activeChat = chat.state.activeChat
    if (tsIo && activeChat && otherUser && text.trim()) {
      setSendingMessage(true)
      const result = await tsIo.actions.chat.sendMessage({
        chatId: activeChat.id,
        text,
        senderId: user.id,
        receiverId: otherUser.id,
      })
      if (result.success) {
        chat.dispatch({
          type: 'UPDATE_CHAT',
          payload: {
            chat: result.data,
          },
        })
        setText('')
      }
      setSendingMessage(false)
    }
  }

  if (!chat.state.activeChat) {
    return (
      <Card
        header={<Header right={<SearchAction user={user} />} />}
        fullScreen
        className="overflow-hidden relative"
      >
        <div className="absolute inset-0 h-full pattern-dots" />
        <div className="w-full h-full flex flex-col items-center justify-center">
          <img
            alt="no active chat"
            width="30%"
            height="30%"
            src="/images/empty_folder.webp"
            className="opacity-25"
          />
          <span className="text-2xl text-slate-300 font-bold">No conversation started yet</span>
        </div>
      </Card>
    )
  }

  if (!otherUser) return null

  return (
    <Card
      header={
        <Header
          left={
            <Avatar displayName nickname={otherUser.nickname} size="md">
              <span className="text-slate-300 text-xs">{userTyping ? 'Typing...' : ''}</span>
            </Avatar>
          }
          right={<SearchAction user={user} />}
        />
      }
      fullScreen
      className="overflow-hidden relative grid-rows-[auto_1fr_auto]"
    >
      <div
        ref={messagesContainerRef}
        className="z-40 flex-1 flex flex-col gap-y-2 overflow-x-hidden overflow-y-auto"
      >
        {chat.state.activeChat.messages.map(msg => {
          const isSendFromUser = msg.senderId === user.id
          if (isSendFromUser) {
            return (
              <div key={msg.id} className="col-start-6 col-end-13 p-3 rounded-lg self-end">
                <div className="flex items-center justify-start flex-row-reverse">
                  <Avatar size="sm" nickname={msg.sender.nickname} />
                  <div className="w-full relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
                    <div className="w-full break-words">{msg.text}</div>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className="col-start-1 col-end-8 p-3 rounded-lg self-start">
              <div className="flex flex-row items-center">
                <Avatar size="sm" nickname={msg.receiver.nickname} />
                <div className="w-full relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                  <div className="w-full break-words">{msg.text}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="z-40 flex flex-row items-center h-16 rounded-xl bg-white w-full p-4 shadow-sm"
      >
        <div className="flex-grow">
          <Input
            autoFocus
            fullWidth
            placeholder="Message..."
            value={text}
            onChange={handleTextChange}
          />
        </div>

        <div className="ml-4">
          <Button type="submit" disabled={sendingMessage}>
            <span>Send</span>
            <span className="ml-2">
              {sendingMessage ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg
                  className="w-4 h-4 transform rotate-45 -mt-px"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Send message</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </span>
          </Button>
        </div>
      </form>

      <div className="absolute inset-0 h-full pattern-dots" />
    </Card>
  )
}
