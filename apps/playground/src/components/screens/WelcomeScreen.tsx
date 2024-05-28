import type React from 'react'
import { useState, type ChangeEvent } from 'react'
import type { User } from '../../types'
import { api } from '../../utils/api'
import { Button } from '../Button'
import { Input } from '../Input'
import { Layout } from '../Layout'
import { Spinner } from '../Spinner'

type Props = {
  onSignUp: (user: User) => void
}

async function checkNicknameAvailability(nickname: string) {
  return await api<boolean>('http://localhost:3010/api/nickname', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  })
}

async function registerUser(nickname: string, password: string) {
  return await api<User>('http://localhost:3010/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname, password }),
  })
}

export function WelcomeScreen({ onSignUp }: Props) {
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setNickname(e.target.value)
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setPassword(e.target.value)
  }

  const handleSubmitNickname = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const value = nickname.trim()

    if (!value || value.length < 4) {
      setError('Nickname must be at least 4 characters long')
      return
    }

    setLoading(true)
    const availability = await checkNicknameAvailability(nickname)
    if (availability.success) {
      const res = await registerUser(nickname, password)
      if (res.success) {
        onSignUp(res.data)
      } else {
        setError(res.error)
      }
    } else {
      setError(availability.error)
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="container mx-auto flex items-center justify-center py-2 max-w-4xl h-screen">
        <div className="self-center w-full h-full flex flex-col items-center justify-center gap-y-6 container max-w-md py-6">
          <h1 className="text-3xl font-semibold">Sign in:</h1>

          <form className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-4">
              <Input
                type="text"
                autoFocus
                fullWidth
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="John Doe"
                className=" h-14 text-xl font-semibold"
              />
              <Input
                type="password"
                fullWidth
                value={password}
                onChange={handlePasswordChange}
                placeholder="*************"
                className=" h-14 text-xl font-semibold"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              onClick={handleSubmitNickname}
              className="w-full h-12 gap-x-3 px-6"
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  height="1em"
                  width="1em"
                  className="w-6 h-6"
                >
                  <title>Submit nickname</title>
                  <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z" />
                </svg>
              )}
              <span className="text-xl font-bold uppercase tracking-widest">Sign in</span>
            </Button>
          </form>

          {error && <span className="text-center text-pretty text-xl text-red-500">{error}</span>}
        </div>
      </div>
    </Layout>
  )
}
