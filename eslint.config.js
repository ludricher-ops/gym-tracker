// Configuration ESLint flat (ESLint 9+) — TypeScript + React.
// Garde-fou doux : on cible les vraies fautes (hooks, JSX cassé, variables
// inutilisées) sans imposer un style. Pas de Prettier.

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.cjs', 'scripts/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2024 },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: '18' } },
    rules: {
      'no-console': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['server.js', 'src/server/**/*.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
]
