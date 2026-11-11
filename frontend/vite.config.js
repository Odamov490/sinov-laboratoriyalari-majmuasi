import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', changeOrigin: true, ws: true },
      // OnlyOffice (ixtiyoriy, lokal ishlab chiqishda): ONLYOFFICE_DEV_URL=http://localhost:9980
      '/onlyoffice': {
        target: process.env.ONLYOFFICE_DEV_URL || 'http://localhost:9980',
        changeOrigin: true,
        ws: true,
        rewrite: (p) => p.replace(/^\/onlyoffice/, ''),
      },
    },
  },
});
