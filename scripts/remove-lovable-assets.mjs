import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const files = ['dist/index.html', 'dist/404.html'];
const replacements = [
  ['https://growth-and-advancement-garden.lovable.app/assets/jewelry-CwLx7kUY.jpg', './mahgold-header.webp'],
  ['https://growth-and-advancement-garden.lovable.app/assets/melted-nOWRYhbE.jpg', './mahgold-brand-masthead.jpg'],
  ['https://growth-and-advancement-garden.lovable.app/assets/coin-CsyrnHPB.jpg', './mahgold-header.webp'],
  ['https://growth-and-advancement-garden.lovable.app/assets/bar-B0yyIRPP.jpg', './mahgold-brand-masthead.jpg'],
  ['const mn="https://growth-and-advancement-garden.lovable.app/assets/"', 'const mn="./"'],
  ['slide-necklace-Bn1Ooa9V.jpg', 'mahgold-header.webp'],
  ['slide-gift-CrjacK5c.jpg', 'mahgold-brand-masthead.jpg'],
  ['slide-invest-CIEhMTDg.jpg', 'mahgold-header.webp'],
  ['jewelry-CwLx7kUY.jpg', 'mahgold-header.webp'],
  ['melted-nOWRYhbE.jpg', 'mahgold-brand-masthead.jpg'],
  ['coin-CsyrnHPB.jpg', 'mahgold-header.webp'],
  ['bar-B0yyIRPP.jpg', 'mahgold-brand-masthead.jpg'],
];

for (const file of files) {
  if (!existsSync(file)) continue;
  let html = readFileSync(file, 'utf8');
  for (const [from, to] of replacements) html = html.replaceAll(from, to);
  if (/growth-and-advancement-garden\.lovable\.app/i.test(html) || /lovable\.app/i.test(html)) {
    throw new Error(`Lovable-hosted asset reference remains in ${file}`);
  }
  writeFileSync(file, html, 'utf8');
  console.log(`Verified Lovable-free storefront: ${file} (${Buffer.byteLength(html)} bytes)`);
}
