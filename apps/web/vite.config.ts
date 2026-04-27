import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

const webRoot = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(webRoot, "../..");

const sharedSrcIndex = resolve(monorepoRoot, "libs/shared/src/index.ts");

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, join(process.cwd(), "..", ".."), "");

	const apiUrl =
		env.NODE_ENV === "development"
			? `http://localhost:${env.APP_PORT}`
			: `http://${env.AWS_PUBLIC_DNS}:${env.APP_PORT}`;

	const previewProxyTarget =
		process.env.API_PROXY_TARGET ??
		(env.NODE_ENV === "development"
			? `http://localhost:${env.APP_PORT}`
			: `http://${env.AWS_PUBLIC_DNS}:${env.APP_PORT}`);

	const apiProxy = {
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
	} as const;

	const previewProxy = {
		"/api/v1": {
			target: previewProxyTarget,
			changeOrigin: true,
			secure: false,
		},
		"/r": {
			target: previewProxyTarget,
			changeOrigin: true,
			secure: false,
		},
	} as const;

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
			allowedHosts: true,
			proxy: previewProxy,
		},
		resolve: {
			alias: {
				"@": resolve(webRoot, "src"),
				"@proxy-server/shared": sharedSrcIndex,
			},
		},
		server: {
			allowedHosts: [env.AWS_PUBLIC_DNS],
			proxy: apiProxy,
		},
	};
});
