import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    exclude: [
      '@tailwindcss/oxide',
      'lightningcss'
    ]
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // Add these settings to ensure modules are built correctly
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    watch: {
      usePolling: true
    }
  }
});
