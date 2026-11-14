import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

function privateSingleFilePreview() {
  return {
    name: 'mahgold-private-single-file-preview',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      const logo = readFileSync('public/mahgold-logo.webp').toString('base64');
      return html.replaceAll('/mahgold-logo.webp', `data:image/webp;base64,${logo}`);
    },
    generateBundle(_options, bundle) {
      const entry = Object.values(bundle).find(item => item.type === 'chunk' && item.isEntry);
      const styles = Object.values(bundle).filter(item => item.type === 'asset' && String(item.fileName).endsWith('.css'));
      if (!entry) throw new Error('Vite entry bundle was not generated.');
      const logoData = 'data:image/webp;base64,' + readFileSync('public/mahgold-logo.webp').toString('base64');
      const css = styles.map(item => String(item.source).replaceAll('/mahgold-logo.webp', logoData)).join('\n');
      let htmlAsset = Object.values(bundle).find(item => item.type === 'asset' && item.fileName.endsWith('.html'));
      if (!htmlAsset) throw new Error('Vite HTML entry was not generated.');
      let html = String(htmlAsset.source);
      html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '');
      html = html.replace(/<link[^>]+href="[^"]+\.css"[^>]*>/g, '');
      html = html.replace(/<script type="module"[^>]+src="[^"]+"[^>]*><\/script>/g, `<script type="module">\n${entry.code.replaceAll('/mahgold-logo.webp', logoData)}\n</script>`);
      html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      htmlAsset.source = html;
      for (const item of [...styles, entry]) delete bundle[item.fileName];
    }
  };
}

export default defineConfig({
  plugins: [react(), privateSingleFilePreview()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false }
});
