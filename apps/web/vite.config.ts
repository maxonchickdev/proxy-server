import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const webRoot = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(webRoot, "../..");

const apiTarget = "http://localhost:3000/api/v1";

const proxyPaths = [
	"/auth",
	"/endpoints",
	"/logs",
	"/analytics",
	"/r",
	"/notifications",
	"/integrations",
];

const sharedSrcIndex = resolve(monorepoRoot, "libs/shared/src/index.ts");

export default defineConfig({
	root: process.cwd(),
	base: "/",
	mode: "development",
	envDir: monorepoRoot,
	cacheDir: "node_modules/.vite",
	plugins: [react(), tailwindcss()],
	optimizeDeps: {
		exclude: ["@proxy-server/shared"],
	},
	resolve: {
		alias: {
			"@": resolve(webRoot, "src"),
			"@proxy-server/shared": sharedSrcIndex,
		},
	},
	server: {
		proxy: Object.fromEntries(
			proxyPaths.map((pathPrefix: string) => [
				pathPrefix,
				{
					target: apiTarget,
					changeOrigin: true,
					secure: true,
				},
			]),
		),
	},
});
