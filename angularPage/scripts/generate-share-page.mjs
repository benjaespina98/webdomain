#!/usr/bin/env node
// Genera dist/angular-page/share.html: una copia del index.html de la app con otros metadatos
// de vista previa (Open Graph / Twitter), para los enlaces que se comparten por WhatsApp.
//
// WhatsApp arma la tarjeta de un link leyendo el HTML estático de esa URL (no ejecuta Angular).
// Con la imagen grande de la landing (1200x630) la tarjeta ocupa media pantalla; con una imagen
// chica (el ícono, 192x192) WhatsApp la muestra como miniatura al costado, en una tarjeta baja.
// vercel.json reescribe /share a este archivo; la app que carga es la misma.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist/angular-page';
const site = 'https://dividimos.vercel.app';

const meta = {
  'property:og:title': 'Resumen de gastos · dividimos?',
  'property:og:description': 'Tocá para ver quién le paga a quién.',
  'property:og:url': `${site}/share`,
  'property:og:image': `${site}/assets/icons/icon-192x192.png`,
  'property:og:image:width': '192',
  'property:og:image:height': '192',
  'property:og:image:alt': 'dividimos?',
  'name:twitter:card': 'summary',
  'name:twitter:title': 'Resumen de gastos · dividimos?',
  'name:twitter:description': 'Tocá para ver quién le paga a quién.',
  'name:twitter:image': `${site}/assets/icons/icon-192x192.png`,
  'name:robots': 'noindex, nofollow'
};

let html = readFileSync(join(dist, 'index.html'), 'utf8');

for (const [key, content] of Object.entries(meta)) {
  const [attr, name] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
  const tag = `<meta ${attr}="${name}" content="${content}" />`;
  const existing = new RegExp(`<meta\\s+${attr}="${name}"[^>]*>`, 'i');
  html = existing.test(html) ? html.replace(existing, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

// Esta página no debe indexarse ni competir con la landing: su canonical es el de la raíz.
html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${site}/" />`);

writeFileSync(join(dist, 'share.html'), html);
console.log(`share.html generado en ${dist}`);
