import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBox from './SearchBox.jsx';
import BrandMark from './BrandMark.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { TOOLS } from '../core/engine.js';

const NAV_LINKS = [
  ['/', 'Home'],
  ['/tools', 'All Tools'],
  ['/categories', 'Categories'],
  ['/tools?f=popular', 'Popular'],
  ['/tools?f=new', 'New Tools'],
];

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container bar">
        <Link className="brand" to="/">
          <BrandMark size={26} />
          Oxvid Tools
        </Link>
        <nav className="main-nav" aria-label="Primary">
          {NAV_LINKS.map(([href, label]) => (
            <Link key={href} to={href}>
              {label}
            </Link>
          ))}
        </nav>
        <SearchBox
          className="header-search"
          inputClassName=""
          placeholder={`Search ${TOOLS.length} tools…`}
        />
        <button
          className="header-theme"
          id="themeBtn"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          dangerouslySetInnerHTML={{
            __html:
              theme === 'dark'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>',
          }}
        />
        <button
          className="mobile-toggle"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          dangerouslySetInnerHTML={{
            __html:
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
          }}
        />
      </div>
      {mobileOpen && (
        <nav className="mobile-nav container" aria-label="Mobile" style={{ display: 'block' }}>
          {NAV_LINKS.map(([href, label]) => (
            <Link key={href} to={href} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
