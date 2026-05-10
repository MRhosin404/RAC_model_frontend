import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5400',  // ← changed from 5000 to 5400
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5400',    // ← changed from 5000 to 5400
        ws: true,
      },
    },
  },
});