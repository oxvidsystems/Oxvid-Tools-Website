import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:4180';

// At least 2-3 tools per category, covering every category and a mix of
// simple calculators, canvas/image tools, and CDN-loading PDF/gen tools.
const TOOLS = [
  // pdf
  'pdf-merge', 'pdf-split', 'pdf-to-text', 'pdf-protect',
  // image
  'image-resize', 'image-compress', 'favicon-generator',
  // text
  'word-counter', 'case-converter', 'lorem-ipsum-generator',
  // dev
  'json-formatter', 'hash-generator', 'regex-tester', 'uuid-generator',
  // calc
  'percentage-calculator', 'bmi-calculator', 'unit-converter',
  // seo
  'meta-title-generator', 'keyword-suggestion-generator', 'utm-builder',
  // finance
  'roi-calculator', 'invoice-generator', 'vat-calculator',
  // gen
  'qr-code-generator', 'password-generator', 'barcode-generator',
  // color
  'hex-to-rgb', 'color-contrast-checker', 'gradient-generator',
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
let failCount = 0;

for (const slug of TOOLS) {
  const errors = [];
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`${BASE}/tool/${slug}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const realErrors = errors.filter(
    (e) => !/ERR_CERT_AUTHORITY_INVALID|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|Could not load a required library/.test(e),
  );

  const hasWorkspaceContent = await page.evaluate(() => {
    const ws = document.querySelector('.workspace');
    return ws && ws.children.length > 0;
  });

  const ok = realErrors.length === 0 && hasWorkspaceContent;
  if (!ok) failCount++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} /tool/${slug}` +
      (hasWorkspaceContent ? '' : ' -- EMPTY WORKSPACE') +
      (realErrors.length ? ' -- ' + realErrors.join(' | ') : ''),
  );
}

console.log(`\n${TOOLS.length - failCount}/${TOOLS.length} passed`);
await browser.close();
process.exit(failCount > 0 ? 1 : 0);
