import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    client: './src/wsAdapter-client.ts',
    server: './src/wsAdapter-server.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  minify: false,
})
