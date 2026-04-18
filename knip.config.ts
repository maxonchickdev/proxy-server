import type { KnipConfig } from "knip";

const config: KnipConfig = {
	$schema: "https://unpkg.com/knip@5/schema.json",
	workspaces: {
		"apps/backend": {
			project: ["src/**/*.ts"],
			ignoreDependencies: ["@prisma/client", "tsconfig-paths"],
			ignoreBinaries: ["compodoc"],
			ignoreFiles: [
				"src/core/rate-limit/rate-limit.module.ts",
				"src/core/schedule/schedule.module.ts",
				"src/modules/email/email.constants.ts",
			],
		},
		"apps/web": {
			project: ["src/**/*.{ts,tsx}"],
			entry: ["index.html"],
			ignoreDependencies: ["zod"],
			ignore: [
				"src/apis/analytics.api.ts",
				"src/apis/auth.api.ts",
				"src/apis/endpoints.api.ts",
				"src/apis/logs.api.ts",
				"src/apis/notifications.api.ts",
			],
		},
		"libs/shared": {
			project: ["src/**/*.ts"],
		},
	},
	ignoreDependencies: ["source-map-support", "@commitlint/types"],
};

export default config;
