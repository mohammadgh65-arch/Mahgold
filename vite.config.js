import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function privateSingleFilePreview() {
  return {
    name: 'mahgold-private-single-file-preview',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      const logo = readFileSync('public/mahgold-logo.webp').toString('base64');
      return html.replaceAll('/mahgold-logo.webp', `data:image/webp;base64,${logo}`);
    },
    writeBundle(options, bundle) {
      const entry = Object.values(bundle).find(item => item.type === 'chunk' && item.isEntry);
      const styles = Object.values(bundle).filter(item => item.type === 'asset' && String(item.fileName).endsWith('.css'));
      if (!entry) throw new Error('Vite entry bundle was not generated.');
      const logoData = 'data:image/webp;base64,' + readFileSync('public/mahgold-logo.webp').toString('base64');
      const css = styles.map(item => String(item.source).replaceAll('/mahgold-logo.webp', logoData)).join('\n');
      const outputDir = options.dir || 'dist';
      const htmlPath = join(outputDir, 'index.html');
      let html = readFileSync(htmlPath, 'utf8');
      html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '');
      html = html.replace(/<link[^>]+href="[^"]+\.css"[^>]*>/g, '');
      html = html.replace(/<script\b[^>]*\bsrc=["'][^"']+\.js["'][^>]*>\s*<\/script>/g, `<script type="module">\n${entry.code.replaceAll('/mahgold-logo.webp', logoData)}\n</script>`);
      html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      writeFileSync(htmlPath, html, 'utf8');
    }
  };
}

export default defineConfig({
  plugins: [react(), privateSingleFilePreview()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false }
});
