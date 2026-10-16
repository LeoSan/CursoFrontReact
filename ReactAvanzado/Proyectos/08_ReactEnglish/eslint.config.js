import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist', 'node_modules', '**/*.d.ts'],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2024,
        sourceType: 'module',
      },
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2024,
        sourceType: 'module',
        project: false,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react'],
              message: '❌ Domain layer (src/domain/**) may NOT import from React.',
            },
            {
              group: ['zod'],
              message: '❌ Domain layer (src/domain/**) may NOT import from Zod.',
            },
            {
              group: ['@application*'],
              message: '❌ Domain layer (src/domain/**) may NOT import from Application layer.',
            },
            {
              group: ['@infrastructure*'],
              message: '❌ Domain layer (src/domain/**) may NOT import from Infrastructure layer.',
            },
            {
              group: ['@presentation*'],
              message: '❌ Domain layer (src/domain/**) may NOT import from Presentation layer.',
            },
            {
              group: ['**/application/**'],
              message:
                '❌ Domain layer (src/domain/**) may NOT import from Application layer (relative path).',
            },
            {
              group: ['**/infrastructure/**'],
              message:
                '❌ Domain layer (src/domain/**) may NOT import from Infrastructure layer (relative path).',
            },
            {
              group: ['**/presentation/**'],
              message:
                '❌ Domain layer (src/domain/**) may NOT import from Presentation layer (relative path).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts', 'src/application/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react'],
              message: '❌ Application layer (src/application/**) may NOT import from React.',
            },
            {
              group: ['@infrastructure*'],
              message:
                '❌ Application layer (src/application/**) may NOT import from Infrastructure layer.',
            },
            {
              group: ['@presentation*'],
              message:
                '❌ Application layer (src/application/**) may NOT import from Presentation layer.',
            },
            {
              group: ['**/infrastructure/**'],
              message:
                '❌ Application layer (src/application/**) may NOT import from Infrastructure layer (relative path).',
            },
            {
              group: ['**/presentation/**'],
              message:
                '❌ Application layer (src/application/**) may NOT import from Presentation layer (relative path).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/infrastructure/**/*.ts', 'src/infrastructure/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@application*'],
              message:
                '❌ Infrastructure layer (src/infrastructure/**) may NOT import from Application layer.',
            },
            {
              group: ['@presentation*'],
              message:
                '❌ Infrastructure layer (src/infrastructure/**) may NOT import from Presentation layer.',
            },
            {
              group: ['**/application/**'],
              message:
                '❌ Infrastructure layer (src/infrastructure/**) may NOT import from Application layer (relative path).',
            },
            {
              group: ['**/presentation/**'],
              message:
                '❌ Infrastructure layer (src/infrastructure/**) may NOT import from Presentation layer (relative path).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/presentation/**/*.ts', 'src/presentation/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@infrastructure*'],
              message:
                '❌ Presentation layer (src/presentation/**) may NOT import from Infrastructure layer. Only src/app/** and src/main.tsx may do so (composition root).',
            },
            {
              group: ['**/infrastructure/**'],
              message:
                '❌ Presentation layer (src/presentation/**) may NOT import from Infrastructure layer (relative path). Only src/app/** and src/main.tsx may do so (composition root).',
            },
          ],
        },
      ],
    },
  },
]
