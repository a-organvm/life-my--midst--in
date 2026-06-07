import nextConfig from 'eslint-config-next/core-web-vitals';

export default [
  // Global ignores
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'coverage/'],
  },

  // Next.js core-web-vitals (native flat config in v16)
  ...nextConfig,

  // Custom rules for all TS/TSX files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Relaxed: Next.js 16 + React 19 typing gaps
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Type-checked rules require parserOptions.project — use base versions instead
      '@typescript-eslint/require-await': 'off',
      'require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      'no-console': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-html-link-for-pages': 'warn',
      // eslint-config-next@16 introduces new React compiler rules that produce
      // false positives for standard async-data-fetch and WebSocket-callback patterns
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'warn',
    },
  },

  // API routes have more dynamic typing needs
  {
    files: ['src/app/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Test files
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/test/**/*.ts', '**/test/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/require-await': 'off',
      'require-await': 'off',
    },
  },
];
