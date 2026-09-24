import { Link } from 'react-router-dom';
import { CAT_BY_KEY, isLive } from '../core/engine.js';

export default function ToolCard({ tool }) {
  const cat = CAT_BY_KEY[tool.category];
  const initials = tool.name.split(' ').map((w) => w[0]).slice(0, 2).join('');

  return (
    <Link className="tool-card" to={`/tool/${tool.slug}`}>
      <div className="icon">{initials}</div>
      <h3>{tool.name}</h3>
      <p className="desc">{tool.description}</p>
      <div className="meta">
        <span>{cat.name}</span>
        {tool.popular ? (
          <span className="tag popular">Popular</span>
        ) : !isLive(tool) ? (
          <span className="tag soon">Coming soon</span>
        ) : null}
      </div>
    </Link>
  );
}
