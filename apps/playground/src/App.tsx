import { initClient } from '@ts-io/core'
import './App.css'
import reactLogo from './assets/react.svg'
import { useSocket } from './socket/useSocket'
import viteLogo from '/vite.svg'
import { postContract } from '@ts-io/utils'
import { useMemo } from 'react'

function App() {
  const socket = useSocket()
  const postClient = useMemo(() => initClient(socket, postContract), [socket])

  const handleEvent = () => {
    postClient.actions.createPost({ title: 'New post', description: 'Post description' })
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <p className="read-the-docs">Click the button bellow to test ts-io</p>
      <div className="card">
        <button onClick={handleEvent}>Emit createPost socket event</button>
      </div>
    </>
  )
}

export default App
