import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const out = 'dist';
const assetDir = join(out, 'assets');
const logo = 'data:image/svg+xml;base64,' + readFileSync('public/mahgold-app-icon.svg').toString('base64');
const masthead = 'data:image/jpeg;base64,' + readFileSync('public/mahgold-brand-masthead.jpg').toString('base64');
const brandLogo = 'data:image/webp;base64,' + readFileSync('public/mahgold-logo.webp').toString('base64');
let html = readFileSync(join(out, 'index.html'), 'utf8').replaceAll('\\n', '\n');

html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');
html = html.replace(/<link[^>]*rel=["']manifest["'][^>]*>/g, '');
let bundledScripts = 0;
html = html.replace(/<script[^>]*src=["']((?:\/|\.\/)?assets\/[^"']+\.js)["'][^>]*>\s*<\/script>/g, (_tag, src) => {
  const file = join(assetDir, basename(src));
  const code = readFileSync(file, 'utf8').replaceAll('/mahgold-app-icon.svg', logo).replaceAll('./mahgold-logo.webp', brandLogo);
  bundledScripts++;
  return '<script type="module">\n' + code + '\n</script>';
});
if (bundledScripts !== 1) throw new Error('Expected exactly one JavaScript bundle; found ' + bundledScripts);

html = html.replace(/<link[^>]*href=["']((?:\/|\.\/)?assets\/[^"']+\.css)["'][^>]*>/g, (_tag, href) => {
  const file = join(assetDir, basename(href));
  return '<style>\n' + readFileSync(file, 'utf8').replaceAll('/mahgold-logo.webp', brandLogo) + '\n</style>';
});
html = html.replaceAll('/mahgold-app-icon.svg', logo);
html = html.replaceAll('/mahgold-brand-masthead.jpg', masthead);

if (/<script[^>]+src=["'](?:\/|\.\/)?assets\/|<link[^>]+href=["'](?:\/|\.\/)?assets\/[^"']+\.css/.test(html)) {
  throw new Error('External local JS/CSS reference remains in standalone HTML.');
}
if (!html.includes('data:image/svg+xml;base64')) throw new Error('Embedded SVG logo is missing.');
if (!html.includes('data:image/jpeg;base64')) throw new Error('Embedded Mahgold masthead image is missing.');
if (!html.includes('data:image/webp;base64')) throw new Error('Embedded original Mahgold logo is missing.');
if (!html.includes('ورود مدیریت مه‌گلد')) throw new Error('Admin login screen is missing.');
writeFileSync(join(out, 'index.html'), html, 'utf8');
console.log('Standalone admin preview created:', Buffer.byteLength(html), 'bytes');
