import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isElectronBuild = process.env.BUILD_TARGET === 'electron';

export default defineConfig({
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
    // Use esbuild (default, fast) for minification — no extra dep needed
    minify: 'esbuild',
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Split vendor libs into named chunks so browsers cache them independently
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/appwrite')) {
            return 'vendor-appwrite';
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-gemini'; // lazy-loaded, only fetched when AI Insights clicked
          }
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
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
