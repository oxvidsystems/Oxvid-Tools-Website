import { Link } from 'react-router-dom';
import ToolCard from './ToolCard.jsx';

export function SectionHead({ title, sub, href }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {href ? (
        <Link className="view-all" to={href}>
          View all →
        </Link>
      ) : null}
    </div>
  );
}

export default function Section({ title, sub, tools, viewAllHref }) {
  return (
    <section className="section tight">
      <div className="container">
        <SectionHead title={title} sub={sub} href={viewAllHref} />
        <div className="tool-grid">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
