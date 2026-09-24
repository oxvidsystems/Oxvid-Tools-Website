import { useEffect } from 'react';

// React port of the original PageStatic(): a simple prose page rendered
// from a trusted, hard-coded HTML string owned by this codebase (About,
// Privacy, Terms) — never from user or external input.
export default function StaticPage({ title, htmlCopy }) {
  useEffect(() => {
    document.title = `${title} — Toolworks`;
  }, [title]);

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, marginBottom: 18 }}>{title}</h1>
      <div
        style={{ color: 'var(--ink)', fontSize: 14.5, lineHeight: 1.7 }}
        className="static-copy"
        dangerouslySetInnerHTML={{ __html: htmlCopy }}
      />
    </div>
  );
}
