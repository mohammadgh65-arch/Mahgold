import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: '/Mahgold/',
  plugins: [react()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    // The downloadable preview must be a single JS bundle so it also runs
    // when opened locally from Android Chrome (file://), without chunk imports.
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
