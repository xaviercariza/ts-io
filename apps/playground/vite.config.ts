import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
