import { Link } from 'react-router-dom';
import { toolsInCategory, svgIcon } from '../core/engine.js';

export default function CategoryCard({ category }) {
  const count = toolsInCategory(category.key).length;

  return (
    <Link className="cat-card" to={`/category/${category.key}`}>
      <div className="icon" dangerouslySetInnerHTML={{ __html: svgIcon(category.key) }} />
      <div>
        <h3>{category.name}</h3>
        <p className="count">{count} tools</p>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{category.desc}</p>
      </div>
    </Link>
  );
}
