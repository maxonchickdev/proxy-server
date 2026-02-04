import { type KnipConfig } from 'knip';

const config: KnipConfig = {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  workspaces: {
    'apps/backend': {
      entry: ['src/main.ts'],
      project: ['src/**/*.ts'],
    },
    'apps/web': {
      entry: ['src/main.tsx', 'index.html'],
      project: ['src/**/*.{ts,tsx}'],
    },
    'libs/shared': {
      project: ['src/**/*.ts'],
    },
  },
  ignoreDependencies: [
    '@types/express',
    'source-map-support',
    '@commitlint/cli',
    '@commitlint/types',
  ],
  ignore: ['**/node_modules/**', '**/dist/**'],
};

export default config;
