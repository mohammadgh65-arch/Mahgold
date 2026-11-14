import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const out = 'dist';
const assetDir = join(out, 'assets');
const logo = 'data:image/webp;base64,' + readFileSync('public/mahgold-logo.webp').toString('base64');
let html = readFileSync(join(out, 'index.html'), 'utf8');

html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');
html = html.replace(/<script[^>]*src=["']([^"']+\\.js)["'][^>]*>\\s*<\\/script>/g, (_tag, src) => {
  const file = join(assetDir, basename(src));
  const code = readFileSync(file, 'utf8').replaceAll('/mahgold-logo.webp', logo);
  return '<script type="module">\\n' + code + '\\n</script>';
});
html = html.replace(/<link[^>]*href=["']([^"']+\\.css)["'][^>]*>/g, (_tag, href) => {
  const file = join(assetDir, basename(href));
  return '<style>\\n' + readFileSync(file, 'utf8').replaceAll('/mahgold-logo.webp', logo) + '\\n</style>';
});
html = html.replaceAll('/mahgold-logo.webp', logo);
if (/<script[^>]+src=|<link[^>]+\\.css/.test(html)) throw new Error('External JS/CSS asset reference remains in standalone HTML.');
if (!html.includes('data:image/webp;base64')) throw new Error('Embedded brand logo is missing.');
writeFileSync(join(out, 'index.html'), html, 'utf8');
console.log('Standalone preview created:', Buffer.byteLength(html), 'bytes');
