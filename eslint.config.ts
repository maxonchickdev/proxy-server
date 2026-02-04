import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const globalIgnores: string[] = [
  '**/dist/**',
  '**/node_modules/**',
  '**/*.d.ts',
  '**/.git/**',
];

const globalExtends = [
  tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
];

export default defineConfig([
  {
    name: 'Global ignores',
    ignores: globalIgnores,
  },
  {
    name: 'Backend application',
    files: ['apps/backend/src/**/*.ts'],
    extends: globalExtends,
  },
  {
    name: 'Web application',
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: globalExtends,
  },
  {
    name: 'Shared lib',
    files: ['libs/shared/src/**/*.ts'],
    extends: globalExtends,
  },
]);
