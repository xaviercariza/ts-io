/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@ts-io/eslint-config/library.js'],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['prettier.config.cjs', 'lint-staged.config.mjs'],
  parserOptions: {
    project: true,
  },
}
