// Crawls the already-built dist/ output and saves a fully-rendered HTML
// snapshot of every route into public/_prerendered/<route>/index.html.
// These are committed as ordinary static files — Vercel's build just copies
// them into dist/ like any other public/ asset, no browser needed on
// Vercel's build machine. middleware.js serves them to non-JS crawlers and
// link-unfurl bots only; real visitors always get the normal SPA.
//
// Run this locally (`npm run prerender`) after `npm run build`, whenever
// content changes, and commit the output.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { VALID_ROUTES } from '../middleware-routes.generated.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const OUT_DIR = path.join(__dirname, '../public/_prerendered');
const PORT = 5177;
const CONCURRENCY = 6;

if (!existsSync(DIST_DIR)) {
  console.error('prerender: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  let filePath = path.join(DIST_DIR, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    try {
      const fallback = await readFile(path.join(DIST_DIR, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(fallback);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  }
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`prerender: serving dist/ at http://127.0.0.1:${PORT}`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function renderRoute(route) {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
  // Let useSEO's effects settle, then force the count-up/reveal animations
  // to their final state — they're IntersectionObserver-triggered and
  // never fire for content that's never scrolled into view here, which
  // doesn't matter for a bot snapshot but would otherwise freeze at "0".
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelectorAll('.count-up').forEach((el) => {
      el.textContent = el.getAttribute('data-target') || '0';
    });
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  });
  const html = await page.content(); // already includes the doctype
  await page.close();

  const outPath = route === '/' ? path.join(OUT_DIR, 'index.html') : path.join(OUT_DIR, route, 'index.html');
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, html);
  return outPath;
}

let done = 0;
async function worker(queue) {
  while (queue.length) {
    const route = queue.shift();
    try {
      await renderRoute(route);
    } catch (err) {
      console.error(`prerender: FAILED ${route}:`, err.message);
    }
    done++;
    if (done % 20 === 0 || done === VALID_ROUTES.length) {
      console.log(`prerender: ${done}/${VALID_ROUTES.length}`);
    }
  }
}

const queue = [...VALID_ROUTES];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

await browser.close();
server.close();
console.log(`prerender: wrote ${VALID_ROUTES.length} snapshots to public/_prerendered/`);
