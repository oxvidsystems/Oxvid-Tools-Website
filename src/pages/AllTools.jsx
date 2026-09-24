import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TOOLS, CATEGORIES, isLive, svgIcon } from '../core/engine-core.js';
import ToolCard from '../components/ToolCard.jsx';
import { useSEO } from '../hooks/useSEO.js';

export default function AllTools() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('relevance');
  const [pill, setPill] = useState(() => {
    if (searchParams.get('f') === 'popular') return 'popular';
    if (searchParams.get('f') === 'new') return 'new';
    return 'all';
  });

  // Canonicalizes to the base /tools URL regardless of filter/search query
  // params, so the many filter combinations don't dilute as duplicate pages.
  useSEO({
    title: 'All Tools',
    description: `Browse the complete registry of ${TOOLS.length} tools across ${CATEGORIES.length} categories — PDF, image, text, developer, calculator, SEO, finance, generator and color tools.`,
    path: '/tools',
  });

  const list = useMemo(() => {
    let l = TOOLS.slice();
    const q = query.trim().toLowerCase();
    if (q) l = l.filter((t) => t.keywords.includes(q));
    if (category) l = l.filter((t) => t.category === category);
    if (pill === 'popular') l = l.filter((t) => t.popular);
    if (pill === 'live') l = l.filter(isLive);
    if (pill === 'soon') l = l.filter((t) => !isLive(t));
    if (pill === 'new') l = l.slice(-24);
    if (sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'popular') l.sort((a, b) => b.popular - a.popular || b.featured - a.featured);
    else if (sort === 'status') l.sort((a, b) => isLive(b) - isLive(a));
    return l;
  }, [query, category, pill, sort]);

  return (
    <>
      <div className="page-head container">
        <h1>All Tools</h1>
        <p>
          Browse the complete registry — {TOOLS.length} tools across {CATEGORIES.length}{' '}
          categories.
        </p>
      </div>
      <div className="container section tight">
        <div className="filter-bar">
          <div className="search-wrap">
            <span
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: svgIcon('search') }}
            />
            <input
              type="search"
              placeholder="Filter tools…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="relevance">Sort: Relevance</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="popular">Sort: Popular first</option>
            <option value="status">Sort: Live first</option>
          </select>
        </div>

        <div className="pill-row">
          {[
            ['all', 'All'],
            ['popular', 'Popular'],
            ['live', 'Live now'],
            ['soon', 'Coming soon'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`pill${pill === key ? ' active' : ''}`}
              onClick={() => setPill(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 12px' }}>
          {list.length} tool{list.length === 1 ? '' : 's'}
        </p>

        {list.length === 0 ? (
          <div className="empty-state">
            <span dangerouslySetInnerHTML={{ __html: svgIcon('empty') }} />
            <p>No tools match your filters.</p>
          </div>
        ) : (
          <div className="tool-grid">
            {list.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
