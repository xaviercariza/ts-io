import { defineConfig } from 'tsup'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  clean: false,
  dts: true,
  entry: { core: 'src/index.ts' },

  format: ['cjs', 'esm'],
  minify: isProduction,
  sourcemap: true,
})
