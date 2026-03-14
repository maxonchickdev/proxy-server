import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/endpoints': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/analytics': 'http://localhost:3000',
      '/r': 'http://localhost:3000',
      '/notifications': 'http://localhost:3000',
    },
  },
});
