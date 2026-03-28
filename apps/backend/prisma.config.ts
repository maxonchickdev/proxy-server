import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

loadEnvFile(join(__dirname, "../../.env"));

const databaseUrl: string | undefined =
	process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!databaseUrl) {
	throw new Error(
		"DATABASE_URL or POSTGRES_URL must be set for Prisma (see .env.example)",
	);
}

const seedScriptPath: string = join(__dirname, "prisma", "seed.ts");

export default defineConfig({
	datasource: {
		url: databaseUrl,
	},
	migrations: {
		path: join(__dirname, "prisma", "migrations"),
		seed: `node --experimental-strip-types "${seedScriptPath}"`,
	},
	schema: join(__dirname, "prisma", "schema.prisma"),
});
