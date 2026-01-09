import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  // 1) Ignore generated / vendor folders
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'logs/**', '.turbo/**', '.next/**'],
  },

  // 2) Base JS recommended rules
  js.configs.recommended,

  // 3) TS recommended rules (non-type-aware; fast)
  ...tseslint.configs.recommended,

  // 4) Your project rules
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Commonly useful strictness with TS
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    },
  },

  // 5) Prettier: disable ESLint rules that conflict with formatting
  eslintConfigPrettier
)
