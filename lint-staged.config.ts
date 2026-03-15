import { type Configuration } from "lint-staged";

const config: Configuration = {
  "*": [
    () =>
      "concurrently 'npm run lint:clean:check' 'npm run lint:fs:check' 'npm run lint:editor:check'",
  ],
  "apps/web/src/**/*.{ts,tsx}": [() => "npm run lint:types:check -w apps/web"],
  "apps/backend/src/**/*.ts": [
    () => "npm run lint:types:check -w apps/backend",
  ],
  "libs/shared/src/**/*.ts": [() => "npm run lint:types:check -w apps/shared"],
};

export default config;
