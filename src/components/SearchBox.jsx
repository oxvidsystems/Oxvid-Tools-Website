import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOOLS, CAT_BY_KEY, esc } from '../core/engine.js';

// React port of the original wireSearch(): live filtering against the tool
// registry, a dropdown of up to 8 matches, and Enter navigating to the full
// "All Tools" search results.
export default function SearchBox({ placeholder, className, inputClassName }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? TOOLS.filter((t) => t.keywords.includes(q) || t.category.includes(q)).slice(0, 8)
    : [];

  function goToResults() {
    navigate(`/tools?q=${encodeURIComponent(query)}`);
    setOpen(false);
  }

  return (
    <div className={className} ref={wrapRef}>
      <span
        className="search-icon"
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
        }}
      />
      <input
        type="search"
        placeholder={placeholder}
        aria-label="Search tools"
        className={inputClassName}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') goToResults();
        }}
      />
      <div className="search-panel" style={{ display: open && q ? 'block' : 'none' }}>
        {q && results.length === 0 && (
          <div className="empty" dangerouslySetInnerHTML={{ __html: `No tools match “${esc(query)}”.` }} />
        )}
        {results.map((t) => (
          <a
            key={t.slug}
            href={`/tool/${t.slug}`}
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              navigate(`/tool/${t.slug}`);
            }}
          >
            <span>{t.name}</span>
            <small>{CAT_BY_KEY[t.category].name}</small>
          </a>
        ))}
      </div>
    </div>
  );
}
