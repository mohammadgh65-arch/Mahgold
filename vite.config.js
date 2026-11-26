import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
  build: {
    // Keep small assets inlined, but let larger files be independently cached
    // instead of embedding them in the main bundle.
    assetsInlineLimit: 4096,
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
