import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Inject environment variables into the app
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    },
    server: {
      port: 5173,
      // Add CORS headers if needed
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:10000',
          changeOrigin: true,
          secure: false,
        }
      }
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
      // Ensure assets are properly copied
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      }
    },
    // Ensure public directory is properly served
    publicDir: 'public',
    css: {
      postcss: './postcss.config.cjs',
    }
  };
});
