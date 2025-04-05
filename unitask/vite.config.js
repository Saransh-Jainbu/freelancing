import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [
      react(),
      // PWA plugin removed to fix build error
    ],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    build: {
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    css: {
      postcss: './postcss.config.cjs',
    }
  };
});
