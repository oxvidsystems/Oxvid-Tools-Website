// Lightweight index of blog posts (slug/title/toolSlug only, no article
// body) for cross-linking from ToolPage.jsx without pulling the full
// article content (src/data/blogPosts.js) into every tool page's bundle.
// Keep this in sync with BLOG_POSTS in blogPosts.js.
export const BLOG_INDEX = [
  { slug: 'reduce-pdf-file-size-without-losing-quality', title: 'How to Reduce PDF File Size Without Losing Quality', toolSlug: 'pdf-compress' },
  { slug: 'json-formatter-guide-why-when-you-need-one', title: 'JSON Formatter: What It Is and When You Actually Need One', toolSlug: 'json-formatter' },
  { slug: 'qr-codes-explained-types-uses-how-to-create', title: 'QR Codes Explained: Types, Uses and How to Create Your Own', toolSlug: 'qr-code-generator' },
  { slug: 'how-to-calculate-bmi-and-what-it-really-means', title: "How to Calculate BMI (and What It Doesn't Tell You)", toolSlug: 'bmi-calculator' },
  { slug: 'password-security-what-actually-makes-a-password-strong', title: 'Password Security in 2026: What Actually Makes a Password Strong', toolSlug: 'password-generator' },
];

export const BLOG_INDEX_BY_TOOL_SLUG = Object.fromEntries(BLOG_INDEX.map((p) => [p.toolSlug, p]));
