import type { Configuration } from "lint-staged";

const config: Configuration = {
	"*": [
		() => "concurrently 'npm run lint:clean:check' 'npm run lint:fs:check'",
	],
	"apps/web/src/**/*.{ts,tsx}": [
		() => "npm run lint:types:check -w apps/web",
		() => "npm run lint:check",
		() => "npm run lint:format:check",
	],
	"apps/backend/src/**/*.ts": [
		() => "npm run lint:types:check -w apps/backend",
		() => "npm run lint:check",
		() => "npm run lint:format:check",
	],
	"libs/shared/src/**/*.ts": [
		() => "npm run lint:types:check -w libs/shared",
		() => "npm run lint:check",
		() => "npm run lint:format:check",
	],
};

export default config;
