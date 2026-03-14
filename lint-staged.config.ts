import { type Configuration } from "lint-staged";

const config: Configuration = {
  "*": [],
  "apps/web/src/**/*.{ts,tsx}": [],
  "apps/backend/src/**/*.ts": [],
  "libs/shared/src/**/*.ts": [],
};

export default config;
