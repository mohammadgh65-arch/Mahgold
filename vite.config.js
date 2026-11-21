import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_ADMIN_PREVIEW === 'true' ? './' : '/Mahgold/',
  plugins: [react()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
