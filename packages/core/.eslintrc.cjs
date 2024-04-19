/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@ts-io/eslint-config/library.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
  // rules: {
  //   '@typescript-eslint/no-unused-vars': [
  //     'error',
  //     {
  //       ignoreRestSiblings: true,
  //       argsIgnorePattern: '^_',
  //       varsIgnorePatterns: '^_',
  //     },
  //   ],
  // },
}
