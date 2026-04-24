import type { KnipConfig } from "knip";

const config: KnipConfig = {
	$schema: "https://unpkg.com/knip@5/schema.json",
	workspaces: {
		"apps/backend": {
			project: ["src/**/*.ts"],
			ignoreDependencies: ["@prisma/client", "tsconfig-paths"],
			ignoreBinaries: ["compodoc"],
			ignoreFiles: [
				"src/core/schedule/schedule.module.ts",
				"src/modules/email/email.constants.ts",
			],
		},
		"apps/web": {
			project: ["src/**/*.{ts,tsx}"],
			entry: ["index.html"],
			ignoreDependencies: ["zod"],
		},
		"libs/shared": {
			project: ["src/**/*.ts"],
		},
	},
	ignoreDependencies: ["source-map-support", "@commitlint/types"],
};

export default config;
