/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@tsio/eslint-config/library.js'],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['prettier.config.cjs', 'lint-staged.config.mjs'],
  parserOptions: {
    project: true,
  },
}
