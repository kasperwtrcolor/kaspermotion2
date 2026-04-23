import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Manual robust polyfills for Node.js built-ins
        'path': path.resolve(__dirname, './src/lib/mocks/empty.js'),
        'fs': path.resolve(__dirname, './src/lib/mocks/empty.js'),
        'url': path.resolve(__dirname, './src/lib/mocks/empty.js'),
        'node:path': path.resolve(__dirname, './src/lib/mocks/empty.js'),
        'node:fs': path.resolve(__dirname, './src/lib/mocks/empty.js'),
        'node:url': path.resolve(__dirname, './src/lib/mocks/empty.js'),
        'esbuild': path.resolve(__dirname, './src/lib/mocks/empty.js'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
