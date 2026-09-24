import { Link } from 'react-router-dom';
import { CATEGORIES } from '../core/engine.js';

export default function Footer() {
  const cols = [
    [
      'Product',
      [
        ['/tools', 'All Tools'],
        ['/categories', 'Categories'],
        ['/tools?f=popular', 'Popular Tools'],
        ['/tools?f=new', 'New Tools'],
      ],
    ],
    ['Categories', CATEGORIES.slice(0, 4).map((c) => [`/category/${c.key}`, c.name])],
    ['More categories', CATEGORIES.slice(4, 8).map((c) => [`/category/${c.key}`, c.name])],
    [
      'Company',
      [
        ['/about', 'About'],
        ['/contact', 'Contact'],
        ['/privacy', 'Privacy Policy'],
        ['/terms', 'Terms'],
      ],
    ],
  ];

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/" style={{ marginBottom: 10, display: 'inline-flex' }}>
            <span className="mark">TW</span>Toolworks
          </Link>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 280, marginTop: 10 }}>
            146 genuinely working tools today, built on an architecture designed to scale to 500+
            without a redesign.
          </p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <h4>{title}</h4>
            {links.map(([href, label]) => (
              <Link key={href} to={href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Toolworks. All tools run in your browser unless noted.</span>
        <span>Built for speed, privacy and clarity.</span>
      </div>
    </footer>
  );
}
