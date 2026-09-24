import { next } from '@vercel/functions';
import { VALID_ROUTES } from './middleware-routes.generated.js';

export const config = {
  matcher: '/((?!assets|favicon|apple-touch-icon|logo-|og-image|robots\\.txt|sitemap\\.xml|_prerendered).*)',
};

const VALID_ROUTE_SET = new Set(VALID_ROUTES);

// Common crawlers and link-unfurl bots that do not execute JavaScript, so
// they only ever see whatever this response body contains — the SPA shell
// they'd otherwise get has no page-specific content or meta tags in it.
const BOT_UA = /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|sogou|exabot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|redditbot|pinterest\/|pinterestbot|embedly|quora link preview|w3c_validator|skypeuripreview|vkshare|nuzzel|flipboard|tumblr|bitlybot|outbrain|developers\.google\.com\/\+\/web\/snippet|showyoubot|opengraph|preview|bot|crawler|spider/i;

const NOT_FOUND_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page not found — Oxvid Tools</title>
<meta name="robots" content="noindex, follow">
<style>
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#F4F9FE;color:#101828;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;}
  @media (prefers-color-scheme: dark){ body{background:#121316;color:#F2F1ED;} }
  .wrap{padding:40px 24px;}
  .mark{width:52px;height:52px;margin:0 auto 20px;display:block;}
  h1{font-size:22px;margin:14px 0 6px;}
  p{color:#586170;font-size:14px;margin:0 0 20px;}
  a{display:inline-flex;color:#fff;background:#2563EB;text-decoration:none;padding:10px 18px;border-radius:7px;font-weight:600;font-size:14px;}
</style>
</head>
<body>
<div class="wrap">
<svg class="mark" viewBox="0 0 32 32" fill="none">
  <defs><linearGradient id="g" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#1949B8"/>
  </linearGradient></defs>
  <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#g)"/>
  <circle cx="10.6" cy="16" r="5.6" fill="none" stroke="#FFFFFF" stroke-width="3"/>
  <rect x="18.3" y="8.6" width="3.1" height="15" rx="1.55" fill="#FFFFFF" transform="rotate(32 19.85 16.1)"/>
  <rect x="18.3" y="8.6" width="3.1" height="15" rx="1.55" fill="#FFFFFF" transform="rotate(-32 19.85 16.1)"/>
  <circle cx="25.6" cy="7.4" r="2.2" fill="#B5651D"/>
</svg>
<h1>That page doesn't exist</h1>
<p>The tool or page you're looking for may have moved.</p>
<a href="/">Browse Oxvid Tools</a>
</div>
</body>
</html>`;

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname === '' ? '/' : url.pathname;

  if (!VALID_ROUTE_SET.has(pathname)) {
    return new Response(NOT_FOUND_HTML, {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const ua = request.headers.get('user-agent') || '';
  if (BOT_UA.test(ua)) {
    const prerenderedPath = pathname === '/' ? '/_prerendered/index.html' : `/_prerendered${pathname}/index.html`;
    try {
      const res = await fetch(new URL(prerenderedPath, request.url));
      if (res.ok) {
        return new Response(res.body, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }
    } catch {
      // fall through to the normal SPA response if a snapshot is missing
    }
  }

  return next();
}
