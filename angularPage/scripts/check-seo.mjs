#!/usr/bin/env node
// Chequeo del SEO básico sobre el build: falla si algo que ayuda a aparecer en buscadores se rompe.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist/angular-page';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const errors = [];

const title = html.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() ?? '';
if (title.length < 20 || title.length > 62) errors.push(`El <title> mide ${title.length} caracteres (ideal: 20–62): "${title}"`);

const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
if (description.length < 70 || description.length > 160) errors.push(`La meta description mide ${description.length} caracteres (ideal: 70–160)`);

if (!/<link rel="canonical" href="https:\/\/dividimos\.vercel\.app\/app"/.test(html)) errors.push('Falta el canonical (https://dividimos.vercel.app/app)');
if (!/<meta name="robots" content="index, follow"/.test(html)) errors.push('La raíz debería poder indexarse');
if (/<meta name="robots" content="[^"]*noindex/.test(html)) errors.push('La raíz no debe tener noindex');
if (!/<noscript>[\s\S]*<h1>/.test(html)) errors.push('Falta el contenido <noscript> con h1 para buscadores sin JavaScript');

// Open Graph / Twitter Cards: los crawlers de LinkedIn, WhatsApp, X y Slack no ejecutan JavaScript,
// así que todo tiene que estar escrito en el HTML estático, con URLs absolutas y una imagen que exista.
const metaContent = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1] ?? '';
for (const [attr, name] of [['property', 'og:title'], ['property', 'og:description'], ['property', 'og:url'], ['property', 'og:image'], ['property', 'og:image:secure_url'],
  ['property', 'og:image:alt'], ['name', 'twitter:title'], ['name', 'twitter:description'], ['name', 'twitter:image'], ['name', 'twitter:image:alt']]) {
  if (!metaContent(attr, name)) errors.push(`Falta <meta ${attr}="${name}">`);
}
if (metaContent('name', 'twitter:card') !== 'summary_large_image') errors.push('twitter:card debería ser summary_large_image');
if (metaContent('property', 'og:image:width') !== '1200' || metaContent('property', 'og:image:height') !== '630') errors.push('og:image debería declarar 1200x630');
const ogImage = metaContent('property', 'og:image');
if (!/^https:\/\/dividimos\.vercel\.app\/og-image\.png$/.test(ogImage)) errors.push(`og:image debe ser una URL absoluta a /og-image.png (hoy: "${ogImage}")`);
try {
  const bytes = statSync(join(dist, 'og-image.png')).size;
  if (bytes > 300 * 1024) errors.push(`og-image.png pesa ${(bytes / 1024).toFixed(0)} KB (máximo 300 KB)`);
} catch {
  errors.push('Falta og-image.png en el build (se sirve en la raíz del sitio)');
}

const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
try {
  const data = JSON.parse(ld ?? '');
  const nodes = data['@graph'] ?? [data];
  const app = nodes.find((node) => node['@type'] === 'WebApplication');
  const site = nodes.find((node) => node['@type'] === 'WebSite');
  if (!app?.name || !app?.description) errors.push('El JSON-LD no tiene un WebApplication con name y description');
  // Google usa el WebSite de la home para decidir el nombre del sitio en los resultados.
  if (site?.name !== 'dividimos?') errors.push('El JSON-LD no tiene un WebSite con name "dividimos?" (nombre del sitio en Google)');
} catch {
  errors.push('Falta el JSON-LD o no es JSON válido');
}

const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
for (const url of ['https://dividimos.vercel.app/', 'https://dividimos.vercel.app/app']) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`El sitemap no incluye ${url}`);
}
if (!readFileSync(join(dist, 'robots.txt'), 'utf8').includes('Sitemap: https://dividimos.vercel.app/sitemap.xml')) errors.push('robots.txt no apunta al sitemap');

// Verificación de propiedad de Google Search Console (método "archivo HTML"): si este archivo
// desaparece del sitio, Google deja de considerarlo verificado.
const googleFile = 'googlecece0d7eb7d6e18a.html';
try {
  if (readFileSync(join(dist, googleFile), 'utf8').trim() !== `google-site-verification: ${googleFile}`) errors.push(`${googleFile} no tiene el contenido que pide Google`);
} catch {
  errors.push(`Falta ${googleFile} en el build (verificación de Google Search Console)`);
}

if (errors.length) {
  console.error('SEO ✗\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log(`SEO ✓  title ${title.length} car., description ${description.length} car., JSON-LD, noscript, sitemap`);
