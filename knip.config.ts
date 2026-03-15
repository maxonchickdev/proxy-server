import { type KnipConfig } from "knip";

const config: KnipConfig = {
  $schema: "https://unpkg.com/knip@5/schema.json",
  workspaces: {
    "apps/backend": {
      project: ["src/**/*.ts"],
    },
    "apps/web": {
      project: ["src/**/*.{ts,tsx}"],
      entry: ["index.html"],
    },
    "libs/shared": {
      project: ["src/**/*.ts"],
    },
  },
  ignoreDependencies: ["source-map-support", "@commitlint/types"],
};

export default config;
