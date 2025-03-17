import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Force the API URL for production to fix localhost references
const apiUrl = 'https://unitask-backend.onrender.com';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add a custom plugin to replace local API URLs during build
    {
      name: 'replace-localhost-urls',
      enforce: 'post',
      transform(code, id) {
        if (id.includes('node_modules')) return;
        
        // Replace all localhost:5000 occurrences with the production URL
        const modified = code
          .replace(/(['"`])http:\/\/localhost:5000\/api(['"`])/g, `$1${apiUrl}/api$2`)
          .replace(/(['"`])http:\/\/localhost:5000(['"`])/g, `$1${apiUrl}$2`)
          .replace(/const\s+\w+\s*=\s*(['"`])http:\/\/localhost:5000\/api(['"`])/g, 
                  `const API_URL = $1${apiUrl}/api$2`);
        
        if (modified !== code) {
          console.log(`[Vite Plugin] Replaced localhost URLs in ${id}`);
          return modified;
        }
      }
    }
  ],
  define: {
    // Explicitly replace these variables in the output
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    'window.API_URL': JSON.stringify(apiUrl),
    // Create a global to ensure it's always available
    'globalThis.API_URL': JSON.stringify(apiUrl),
    'globalThis.API_BASE': JSON.stringify(`${apiUrl}/api`),
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
