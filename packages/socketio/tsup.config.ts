import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    client: './src/client/index.ts',
    server: './src/server/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  minify: false,
})
