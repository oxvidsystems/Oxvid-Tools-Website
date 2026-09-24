import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO.js';

export default function NotFound() {
  useSEO({
    title: 'Page not found',
    description: "The page you're looking for doesn't exist on Oxvid Tools.",
    path: typeof window !== 'undefined' ? window.location.pathname : '/404',
    noindex: true,
  });

  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 64,
          fontWeight: 700,
          color: 'var(--line-strong)',
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: 22, marginTop: 6 }}>That page doesn't exist</h1>
      <p style={{ color: 'var(--muted)', marginTop: 8 }}>
        The tool or page you're looking for may have moved.
      </p>
      <Link
        className="btn btn-primary"
        to="/tools"
        style={{ marginTop: 18, display: 'inline-flex' }}
      >
        Browse all tools
      </Link>
    </div>
  );
}
