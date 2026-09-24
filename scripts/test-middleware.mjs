// Sanity-checks middleware.js logic locally with mock Request objects,
// since real Vercel Edge Middleware can't run in this sandbox. Serves
// dist/_prerendered/... over a local static server so middleware's
// fetch(new URL('/_prerendered/...')) calls resolve against something real.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 5178;

const server = createServer(async (req, res) => {
  const filePath = path.join(DIST_DIR, decodeURIComponent(req.url.split('?')[0]));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const { default: middleware } = await import('../middleware.js');

const BASE = `http://127.0.0.1:${PORT}`;

async function check(label, path, ua) {
  const req = new Request(BASE + path, { headers: ua ? { 'user-agent': ua } : {} });
  const res = await middleware(req);
  const isNext = res.headers.get('x-middleware-next') === '1';
  let bodySnippet = '';
  if (!isNext) {
    const text = await res.text();
    bodySnippet = text.slice(0, 80).replace(/\n/g, ' ');
  }
  console.log(`${label}: status=${res.status}${isNext ? ' (next/passthrough)' : ''} -- ${bodySnippet}`);
}

await check('Valid route, normal browser', '/tool/word-counter', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
await check('Valid route, Googlebot', '/tool/word-counter', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
await check('Valid route, WhatsApp bot', '/tool/json-formatter', 'WhatsApp/2.23.20.0');
await check('Home, Googlebot', '/', 'Googlebot');
await check('Invalid route, normal browser', '/this-does-not-exist', 'Mozilla/5.0');
await check('Invalid route, Googlebot', '/random-junk-path', 'Googlebot');
await check('Valid category route, bot', '/category/image', 'facebookexternalhit/1.1');
await check('Valid but non-existent tool slug', '/tool/does-not-exist-xyz', 'Mozilla/5.0');

server.close();
