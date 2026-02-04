import { type Configuration } from 'lint-staged';

const config: Configuration = {
  '*': [
    (): string =>
      "concurrently 'npm run lint:fs' 'npm run lint:cleanup' 'npm run lint:editor'",
  ],
  'apps/web/src/**/*.{ts,tsx}': [
    (): string => 'npm run lint:check -w apps/web',
    (): string => 'npm run lint:format:check -w apps/web',
  ],
  'apps/backend/src/**/*.ts': [
    (): string => 'npm run lint:check -w apps/backend',
    (): string => 'npm run lint:format:check -w apps/backend',
  ],
  'libs/shared/src/**/*.ts': [
    (): string => 'npm run lint:check -w libs/shared',
    (): string => 'npm run lint:format:check -w libs/shared',
  ],
};

export default config;
