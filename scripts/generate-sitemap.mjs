// Generates public/sitemap.xml from the tool/category data in
// src/core/engine.js at build time, so it never drifts out of sync with the
// actual tool registry. Runs before `vite build` (see package.json).
//
// engine.js is a plain browser module (canvas, document, etc. at call time),
// so instead of importing it under Node we pull out just the two static
// data literals — RAW_TOOLS and CATEGORIES — as text and evaluate those in
// isolation. Both are fixed array/object literals we author ourselves, not
// user input, so this is safe.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://oxvid-tools-website.vercel.app';

const engineSrc = readFileSync(path.join(__dirname, '../src/core/engine.js'), 'utf8');

function extractArrayLiteral(varName) {
  const start = engineSrc.indexOf(`const ${varName} = [`);
  if (start === -1) throw new Error(`generate-sitemap: could not find ${varName} in engine.js`);
  const bracketStart = engineSrc.indexOf('[', start);
  const closeMarker = engineSrc.indexOf('\n];', bracketStart);
  if (closeMarker === -1) throw new Error(`generate-sitemap: could not find end of ${varName}`);
  const literal = engineSrc.slice(bracketStart, closeMarker + 2);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal}`)();
}

const RAW_TOOLS = extractArrayLiteral('RAW_TOOLS');
const CATEGORIES = extractArrayLiteral('CATEGORIES');

const tools = RAW_TOOLS.map(([id, , category]) => ({ id, category }));
const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/tools', changefreq: 'weekly', priority: '0.9' },
  { loc: '/categories', changefreq: 'monthly', priority: '0.7' },
  { loc: '/about', changefreq: 'monthly', priority: '0.4' },
  { loc: '/contact', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.2' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.2' },
];

const categoryRoutes = CATEGORIES.map((c) => ({
  loc: `/category/${c.key}`,
  changefreq: 'weekly',
  priority: '0.7',
}));

const toolRoutes = tools.map((t) => ({
  loc: `/tool/${t.id}`,
  changefreq: 'monthly',
  priority: '0.8',
}));

const allRoutes = [...staticRoutes, ...categoryRoutes, ...toolRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(path.join(__dirname, '../public/sitemap.xml'), xml);
console.log(`generate-sitemap: wrote ${allRoutes.length} URLs to public/sitemap.xml`);
