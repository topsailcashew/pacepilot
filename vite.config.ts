import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for Pace Pilot.
 *
 * Environment variables must be prefixed with VITE_ to be exposed to the
 * client bundle (e.g. VITE_GEMINI_API_KEY).  See .env.example for details.
 */
const isElectronBuild = process.env.BUILD_TARGET === 'electron';

export default defineConfig({
  // Electron loads files via file:// so base must be './' not '/'
  base: isElectronBuild ? './' : '/',
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          charts:   ['recharts'],
          appwrite: ['appwrite'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
