import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			"/auth": "http://localhost:3000/api/v1",
			"/endpoints": "http://localhost:3000/api/v1",
			"/logs": "http://localhost:3000/api/v1",
			"/analytics": "http://localhost:3000/api/v1",
			"/r": "http://localhost:3000/api/v1",
			"/notifications": "http://localhost:3000/api/v1",
		},
	},
});
