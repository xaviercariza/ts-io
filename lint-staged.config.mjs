export default {
  '*.{ts,tsx}': () => ['pnpm run prettier', 'pnpm run types-check', 'pnpm run lint:fix'],
}
