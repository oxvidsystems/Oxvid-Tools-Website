import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  TOOL_BY_SLUG,
  CAT_BY_KEY,
  isLive,
  genHowTo,
  genFeatures,
  genFaq,
  relatedTools,
} from '../core/engine.js';
import ToolWorkspace from '../components/ToolWorkspace.jsx';
import ToolCard from '../components/ToolCard.jsx';
import NotFound from './NotFound.jsx';

export default function ToolPage() {
  const { slug } = useParams();
  const tool = TOOL_BY_SLUG[slug];

  useEffect(() => {
    if (tool) document.title = `${tool.name} — Toolworks`;
  }, [tool]);

  if (!tool) return <NotFound />;

  const cat = CAT_BY_KEY[tool.category];
  const live = isLive(tool);

  return (
    <>
      <div className="container tool-head">
        <div className="crumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <Link to={`/category/${cat.key}`}>{cat.name}</Link>
          <span className="sep">/</span>
          {tool.name}
        </div>
        <h1>{tool.name}</h1>
        <p className="desc">{tool.description}</p>
        <div className="badges">
          <span className="tag">{cat.name}</span>
          {tool.popular && <span className="tag popular">Popular</span>}
          {tool.featured && <span className="tag featured">Featured</span>}
          {!live && <span className="tag soon">Coming soon</span>}
        </div>
      </div>

      <div className="container">
        <ToolWorkspace key={tool.slug} tool={tool} />
      </div>

      <div className="container tool-info">
        <div>
          <h2>How to use {tool.name}</h2>
          <ol className="howto-list">
            {genHowTo(tool).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <h2 style={{ marginTop: 30 }}>Frequently asked questions</h2>
          {genFaq(tool).map(([q, a], i) => (
            <details className="faq-item" key={i}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <div>
          <h2>Features</h2>
          <ul className="feat-list">
            {genFeatures(tool).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <h2 style={{ marginTop: 26 }}>Related tools</h2>
          <div className="related-grid">
            {relatedTools(tool).map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 60 }} />
    </>
  );
}
