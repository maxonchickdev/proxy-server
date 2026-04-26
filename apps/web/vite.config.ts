import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

const webRoot = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(webRoot, "../..");

const sharedSrcIndex = resolve(monorepoRoot, "libs/shared/src/index.ts");

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const apiUrl =
		env.NODE_ENV === "development"
			? "http://localhost:3000"
			: "http://ec2-16-170-170-8.eu-north-1.compute.amazonaws.com:3000";

	return {
		root: process.cwd(),
		base: "/",
		mode: "development",
		envDir: monorepoRoot,
		cacheDir: "node_modules/.vite",
		plugins: [react(), tailwindcss()],
		optimizeDeps: {
			exclude: ["@proxy-server/shared"],
		},
		preview: {
			allowedHosts: [env.AWS_PUBLIC_DNS],
		},
		resolve: {
			alias: {
				"@": resolve(webRoot, "src"),
				"@proxy-server/shared": sharedSrcIndex,
			},
		},
		server: {
			allowedHosts: [env.AWS_PUBLIC_DNS],
			proxy: {
				"/api/v1": {
					target: apiUrl,
					changeOrigin: true,
					secure: true,
				},
				"/r": {
					target: apiUrl,
					changeOrigin: true,
					secure: true,
				},
			},
		},
	};
});
