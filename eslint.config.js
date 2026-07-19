import eslint from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const typedFiles = [
  'next.config.ts',
  'src/app/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
  'src/lib/**/*.ts',
  'src/proxy.ts',
  'src/repositories/**/*.ts',
  'src/services/**/*.ts',
  'src/types/**/*.ts',
];

export default tseslint.config(
  {
    ignores: ['.next/**', 'dist/**', 'coverage/**', 'node_modules/**', 'src/features/**', 'src/shared/**', 'vite.config.ts'],
  },
  {
    ...eslint.configs.recommended,
    files: typedFiles,
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typedFiles,
  })),
  {
    files: typedFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      'react-refresh/only-export-components': 'off',
    },
  },
);
