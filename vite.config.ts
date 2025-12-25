import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const port = parseInt(env.VITE_PORT || '3000', 10);
    return {
      server: {
        port: port,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'copy-index-css',
          closeBundle() {
            copyFileSync('index.css', 'dist/index.css');
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        },
        copyPublicDir: false
      },
      plugins: [
        react(),
        {
          name: 'copy-index-css',
          closeBundle() {
            copyFileSync('index.css', 'dist/index.css');
          }
        }
      ],
      // SPA fallback - serve index.html for all routes
      preview: {
        port: port,
      }
    };
});
