import { useEffect, useState } from 'react'
import type { User } from '../types'
import { api } from '../utils/api'
import { ChatProvider } from './ChatProvider'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { MainScreen } from './screens/MainScreen'
import { TsIoProvider } from './TsIoProvider'

function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function getUser() {
      const response = await api<User>('http://localhost:3010/api/session', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (!response.success) {
        console.error('Error checking session:', response.error)
        setUser(null)
      } else {
        setUser(response.data)
      }
    }

    getUser()

    return () => {
      setUser(null)
    }
  }, [])

  const handleOnLoggedOut = () => setUser(null)

  return (
    <>
      {user ? (
        <TsIoProvider>
          <ChatProvider>
            <MainScreen user={user} onLogOut={handleOnLoggedOut} />
          </ChatProvider>
        </TsIoProvider>
      ) : (
        <WelcomeScreen onSignUp={setUser} />
      )}
    </>
  )
}

export default App
