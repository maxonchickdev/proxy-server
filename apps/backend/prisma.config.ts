import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

loadEnvFile(join(__dirname, "../../.env"));

export default defineConfig({
	datasource: {
		url: env("POSTGRES_URL"),
	},
	migrations: {
		path: join(__dirname, "prisma", "migrations"),
		seed: `node ${join("prisma", "seeders", "seeder.ts")}`,
	},
	schema: join(__dirname, "prisma", "schema.prisma"),
});
