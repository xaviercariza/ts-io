import { useState } from 'react'
import type { UserProfile } from '../types'
import { api } from '../utils/api'
import { useChat } from './ChatProvider/ChatProvider'
import type { Option } from './SearchBar'
import { SearchBar } from './SearchBar'

type Props = { user: UserProfile }

export function SearchAction({ user }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const chat = useChat()

  const handleSearch = async (search: string) => {
    const res = await api<UserProfile[]>(`/api/users/${search}`)
    if (res.success) {
      setUsers(res.data)
    }
  }
  const handleSelectUser = (option: Option) => {
    chat.dispatch({
      type: 'START_CHAT',
      payload: {
        user,
        otherUser: {
          id: option.key,
          nickname: option.label,
        },
      },
    })
  }

  return (
    <div className="self-end rounded-2xl px-4 py-2">
      <SearchBar
        options={users.map(u => ({
          key: u.id,
          label: u.nickname,
          value: u.id,
        }))}
        onSearch={handleSearch}
        onSelect={handleSelectUser}
      />
    </div>
  )
}
