import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for Pace Pilot.
 *
 * Environment variables must be prefixed with VITE_ to be exposed to the
 * client bundle (e.g. VITE_GEMINI_API_KEY).  See .env.example for details.
 */
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
