/**
 * Standalone Vite config for the Aethermancer desktop (Electron) build.
 * Used instead of artifacts/aethermancer/vite.config.ts so we can:
 *  - Set fixed ports without needing Replit env vars
 *  - Proxy /api  →  the local Express server on port 3001
 *  - Strip Replit-only plugins (cartographer, dev-banner)
 */
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const FRONTEND_PORT = 3000;
const API_PORT = 3001;

const aethermancerRoot = path.resolve(import.meta.dirname, '..', 'artifacts', 'aethermancer');

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(aethermancerRoot, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: aethermancerRoot,
  build: {
    outDir: path.resolve(aethermancerRoot, 'dist', 'public'),
    emptyOutDir: true,
  },
  server: {
    port: FRONTEND_PORT,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      // Forward all /api requests (HTTP + WebSocket) to the Express server
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: FRONTEND_PORT,
    host: '0.0.0.0',
  },
});
