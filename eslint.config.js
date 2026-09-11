import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Architecture boundaries (see CLAUDE.md → "Dependency rule").
 * ESLint replaces — not merges — `no-restricted-imports` per matching block,
 * so every scope below re-declares the base restriction via `restrict()`.
 */
const deepModuleImport = {
  group: ['@/modules/*/*'],
  message: 'Import another module only through its public API: "@/modules/<name>".',
};

const restrict = (...patterns) => ['error', { patterns: [deepModuleImport, ...patterns] }];

const noApp = { group: ['@/app', '@/app/*'], message: 'Only src/app may compose the application.' };
const noMocks = {
  group: ['@/mocks', '@/mocks/*'],
  message: 'Only infrastructure adapters and src/app may use mocks.',
};
const noInfrastructure = {
  group: ['**/infrastructure', '**/infrastructure/*'],
  message:
    'Depend on the domain port, not the adapter. Adapters are injected in src/app/container.ts.',
};
const noPresentation = {
  group: ['**/presentation', '**/presentation/*'],
  message: 'Inner layers must not depend on presentation.',
};
const noFrameworks = {
  group: [
    'react',
    'react-dom',
    'react-router',
    '@tanstack/*',
    'zustand',
    '@/shared/ui',
    '@/shared/ui/*',
    '@/shared/http',
    '@/shared/http/*',
  ],
  message: 'The domain layer is plain TypeScript: no frameworks, UI or I/O.',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': restrict(),
    },
  },
  {
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': restrict(
        {
          group: ['@/modules', '@/modules/*'],
          message: 'shared/ must not know about feature modules.',
        },
        noApp,
        noMocks,
      ),
    },
  },
  {
    files: ['src/modules/*/domain/**'],
    rules: {
      'no-restricted-imports': restrict(
        noFrameworks,
        noInfrastructure,
        noPresentation,
        noMocks,
        noApp,
      ),
    },
  },
  {
    files: ['src/modules/*/infrastructure/**'],
    rules: { 'no-restricted-imports': restrict(noPresentation, noApp) },
  },
  {
    files: ['src/modules/*/presentation/**'],
    rules: { 'no-restricted-imports': restrict(noInfrastructure, noMocks, noApp) },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
