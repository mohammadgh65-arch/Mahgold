import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function dedicatedAdminEntry() {
  return {
    name: 'mahgold-dedicated-admin-entry',
    apply: 'build',
    async closeBundle() {
      const outputDir = resolve(process.cwd(), 'dist');
      const storefrontHtml = await readFile(resolve(outputDir, 'index.html'), 'utf8');
      const adminHtml = storefrontHtml
        .replace(/<title>[^<]*<\\/title>/, '<title>مدیریت فروشگاه | مه‌گلد</title>')
        .replace('</head>', '<script>window.__MAHGOLD_ADMIN_ROUTE__=true;</script>\\n</head>');
      await writeFile(resolve(outputDir, 'admin.html'), adminHtml, 'utf8');
    }
  };
}

export default defineConfig({
  plugins: [react(), dedicatedAdminEntry()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
  build: {
    assetsInlineLimit: 4096,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
