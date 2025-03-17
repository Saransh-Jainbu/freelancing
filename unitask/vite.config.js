import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          /<head>/,
          `<head>
          <script>window.API_URL="https://unitask-backend.onrender.com";</script>`
        );
      }
    }
  ],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://unitask-backend.onrender.com'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps to ensure no leaking of localhost URLs
    target: 'esnext',
  },
  css: {
    postcss: './postcss.config.cjs',
  }
});
