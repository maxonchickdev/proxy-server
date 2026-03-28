import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const apiTarget = "http://localhost:3000/api/v1";

const proxyPaths = [
	"/auth",
	"/endpoints",
	"/logs",
	"/analytics",
	"/r",
	"/notifications",
];

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	server: {
		proxy: Object.fromEntries(
			proxyPaths.map((path) => [
				path,
				{
					target: apiTarget,
					changeOrigin: true,
					secure: false,
				},
			]),
		),
	},
});
