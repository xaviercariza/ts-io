/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@ts-io/eslint-config/next.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  ignorePatterns: ['next.config.js', 'theme.config.jsx'],
  overrides: [
    {
      // enable the rule specifically for TypeScript files
      files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
}
