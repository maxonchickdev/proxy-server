import { join } from "node:path";
import { defineConfig } from "prisma/config";

process.loadEnvFile(join(__dirname, ".env"));

const seedScriptPath: string = join(__dirname, "prisma", "seed.ts");

export default defineConfig({
	datasource: {
		url: process.env.POSTGRES_URL,
	},
	migrations: {
		path: join(__dirname, "prisma", "migrations"),
		seed: `node --experimental-strip-types "${seedScriptPath}"`,
	},
	schema: join(__dirname, "prisma", "schema.prisma"),
});
