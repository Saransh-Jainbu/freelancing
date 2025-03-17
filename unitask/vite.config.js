import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Force the API URL for production to fix localhost references
const apiUrl = 'https://unitask-backend.onrender.com';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Force the API URL in the client code
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    // Also make it globally available
    'window.API_URL': JSON.stringify(apiUrl),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
  css: {
    postcss: './postcss.config.cjs',
  }
});
