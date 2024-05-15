import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://dkd4pk-24678.sse.codesandbox.io/
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      port: 3010,
      clientPort: 443,
      path: '/vite-hmr',
    },
  },
})
