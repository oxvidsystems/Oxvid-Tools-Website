import { useEffect } from 'react';

export const SITE_NAME = 'Oxvid Tools';
export const SITE_URL = 'https://oxvid-tools-website.vercel.app';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function upsertMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Keeps document.title plus the meta description, canonical link, Open
// Graph and Twitter Card tags in sync with the current route. This is a
// client-side-only fix: it corrects the tags for any crawler or tool that
// executes JavaScript (Googlebot does), but a crawler that reads only the
// initial server response still sees the generic tags baked into
// index.html — the real fix for that is prerendering/SSR, tracked
// separately since it's a bigger structural change.
export function useSEO({ title, description, path, type = 'website', jsonLd, noindex = false }) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;
    const canonicalUrl = `${SITE_URL}${path}`;

    if (description) upsertMeta('name', 'description', description);
    upsertLink('canonical', canonicalUrl);
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');

    upsertMeta('property', 'og:title', fullTitle);
    if (description) upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    if (description) upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);

    let ldScript = document.getElementById('seo-jsonld');
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.id = 'seo-jsonld';
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }
  }, [title, description, path, type, jsonLd, noindex]);
}
