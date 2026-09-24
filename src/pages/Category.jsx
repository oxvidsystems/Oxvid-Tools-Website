import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CAT_BY_KEY, toolsInCategory, isLive, svgIcon } from '../core/engine.js';
import ToolCard from '../components/ToolCard.jsx';
import NotFound from './NotFound.jsx';

export default function Category() {
  const { key } = useParams();
  const cat = CAT_BY_KEY[key];

  useEffect(() => {
    if (cat) document.title = `${cat.name} — Toolworks`;
  }, [cat]);

  if (!cat) return <NotFound />;

  const tools = toolsInCategory(key);
  const liveCount = tools.filter(isLive).length;

  return (
    <>
      <div className="page-head container">
        <div className="crumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <Link to="/categories">Categories</Link>
          <span className="sep">/</span>
          {cat.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="icon"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--ink)',
              color: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: svgIcon(cat.key) }}
          />
          <h1>{cat.name}</h1>
        </div>
        <p>{cat.desc}</p>
      </div>
      <div className="container section tight">
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 16 }}>
          {liveCount} of {tools.length} tools in this category are live now.
        </p>
        <div className="tool-grid">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </div>
    </>
  );
}
