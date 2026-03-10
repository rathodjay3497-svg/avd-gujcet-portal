import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        api: 'legacy',
        additionalData: `
          @use "@/styles/abstracts/variables" as *;
          @use "@/styles/abstracts/mixins" as *;
        `,
      },
    },
  },
  server: {
    port: 5173,
  },
});
