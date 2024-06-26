import cuid from 'cuid'
import * as React from 'react'
import type { Group, Message, UserProfile } from '../../types'

type Action =
  | { type: 'INIT'; payload: { chats: Group[] } }
  | { type: 'OPEN_CHAT'; payload: { chatKey: string } }
  | { type: 'START_CHAT'; payload: { user: UserProfile; otherUser: UserProfile } }
  | { type: 'UPDATE_CHAT'; payload: { chat: Group } }
type Dispatch = (action: Action) => void
type State = { chats: Record<string, Group>; activeChat: Group | null }
type ChatProviderProps = { children: React.ReactNode }

const ChatContext = React.createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined)

function chatReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT': {
      return {
        ...state,
        chats: action.payload.chats.reduce<Record<string, Group>>((acc, curr) => {
          acc[curr.id] = curr
          return acc
        }, {}),
      }
    }
    case 'OPEN_CHAT': {
      return {
        ...state,
        activeChat: state.chats[action.payload.chatKey] ?? null,
      }
    }
    case 'START_CHAT': {
      const existingChat = Object.values(state.chats).find(c =>
        c.users.some(u => u.id === action.payload.otherUser.id)
      )
      const chat: Group = {
        id: existingChat?.id ?? cuid(),
        messages: existingChat?.messages ?? [],
        users: existingChat?.users ?? [action.payload.user, action.payload.otherUser],
      }
      return {
        ...state,
        chats: { ...state.chats, [chat.id]: chat },
        activeChat: chat,
      }
    }
    case 'UPDATE_CHAT': {
      const isActiveChat = action.payload.chat.id === state.activeChat?.id

      return {
        ...state,
        activeChat: isActiveChat ? action.payload.chat : state.activeChat,
        chats: {
          ...state.chats,
          [action.payload.chat.id]: action.payload.chat,
        },
      }
    }
    default: {
      throw new Error(`Unhandled action type: ${(action as any).type}`)
    }
  }
}

function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = React.useReducer(chatReducer, {
    chats: {},
    activeChat: null,
  })
  const value = { state, dispatch }
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

function useChat() {
  const context = React.useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export { ChatProvider, useChat }
