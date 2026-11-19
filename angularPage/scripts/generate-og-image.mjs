#!/usr/bin/env node
// Genera src/og-image.png (1200x630): la imagen de vista previa de Open Graph / Twitter Cards.
//
// Es una composición con la marca, la propuesta y un ejemplo del resultado, renderizada con Chrome
// (playwright-core, solo devDependency). No toca el bundle de la app. Regenerar con: npm run og:image
// Requiere Google Chrome instalado (o CHROME_PATH apuntando a un ejecutable de Chrome/Chromium).
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ?? join(root, 'src', 'og-image.png');

const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(join(root, file)).toString('base64')}`;
const icon = dataUri('src/assets/icons/icon-192x192.png', 'image/png');
const font = (weight) => dataUri(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff2`, 'font/woff2');

// Margen seguro de 60 px en todos los lados y texto de 40 px o más. Los datos del ejemplo son inventados.
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-weight: 600; src: url(${font(600)}) format('woff2'); }
@font-face { font-family: Inter; font-weight: 800; src: url(${font(800)}) format('woff2'); }
* { box-sizing: border-box; margin: 0; }
body {
  width: 1200px; height: 630px; padding: 60px; overflow: hidden;
  font-family: Inter, sans-serif; color: #f1f5f9;
  background:
    radial-gradient(ellipse 620px 420px at 100% 0%, rgba(124, 58, 237, 0.38), transparent 70%),
    radial-gradient(ellipse 520px 380px at 0% 100%, rgba(139, 92, 246, 0.2), transparent 70%),
    #080d1c;
  display: grid; grid-template-columns: 1fr 420px; column-gap: 56px; align-items: center;
}
.brand { display: flex; align-items: center; gap: 20px; margin-bottom: 36px; }
.brand img { width: 72px; height: 72px; border-radius: 18px; }
.brand span { font-size: 48px; font-weight: 800; color: #c4b5fd; letter-spacing: -0.5px; }
h1 { font-size: 66px; line-height: 1.08; font-weight: 800; letter-spacing: -1.5px; }
h1 em { font-style: normal; color: #a78bfa; }
p { margin-top: 28px; font-size: 40px; line-height: 1.25; font-weight: 600; color: #a7b4c8; }
.card {
  border: 2px solid rgba(139, 92, 246, 0.45); border-radius: 28px; padding: 32px 36px;
  background: rgba(15, 23, 42, 0.85);
}
.row + .row { margin-top: 28px; padding-top: 28px; border-top: 2px solid rgba(148, 163, 184, 0.2); }
.who { font-size: 40px; font-weight: 600; color: #e2e8f0; }
.who b { color: #a78bfa; font-weight: 800; padding: 0 6px; }
.amount { margin-top: 6px; font-size: 56px; font-weight: 800; color: #34d399; letter-spacing: -1px; }
</style></head><body>
<main>
  <div class="brand"><img src="${icon}" alt=""><span>dividimos?</span></div>
  <h1>Dividí gastos<br>grupales<br><em>sin registro</em></h1>
  <p>Mirá quién le paga a quién.</p>
</main>
<aside class="card">
  <div class="row"><div class="who">Carla<b>→</b>Ana</div><div class="amount">$ 13.667</div></div>
  <div class="row"><div class="who">Bruno<b>→</b>Ana</div><div class="amount">$ 5.667</div></div>
</aside>
</body></html>`;

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' })
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(out, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
} finally {
  await browser.close();
}

const kb = (statSync(out).size / 1024).toFixed(0);
console.log(`og-image generada: ${out} (1200x630, ${kb} KB)`);
if (statSync(out).size > 300 * 1024) {
  console.error('La imagen pesa más de 300 KB: simplificá el fondo.');
  process.exit(1);
}
