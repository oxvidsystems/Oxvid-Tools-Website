import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBox from './SearchBox.jsx';
import BrandMark from './BrandMark.jsx';
import ToolsMegaMenu from './ToolsMegaMenu.jsx';
import BlogMegaMenu from './BlogMegaMenu.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { TOOLS } from '../core/engine-core.js';

const MOBILE_NAV_LINKS = [
  ['/', 'Home'],
  ['/tools', 'All Tools'],
  ['/categories', 'Categories'],
  ['/blog', 'Blog'],
  ['/tools?f=popular', 'Popular'],
];

const CARET =
  '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

function NavMegaItem({ label, id, openMenu, setOpenMenu, children }) {
  const isOpen = openMenu === id;
  const closeTimer = useRef(null);

  const open = () => {
    clearTimeout(closeTimer.current);
    setOpenMenu(id);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenMenu((cur) => (cur === id ? null : cur)), 120);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div className={`nav-item${isOpen ? ' open' : ''}`} onMouseEnter={open} onMouseLeave={scheduleClose}>
      <button
        type="button"
        className="nav-trigger"
        aria-expanded={isOpen}
        onClick={() => setOpenMenu((cur) => (cur === id ? null : id))}
      >
        {label}
        <span dangerouslySetInnerHTML={{ __html: CARET }} />
      </button>
      {isOpen && children}
    </div>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return undefined;
    const onClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const closeMenu = () => setOpenMenu(null);

  return (
    <header className="site-header">
      <div className="container bar">
        <Link className="brand" to="/">
          <BrandMark size={26} />
          Oxvid Tools
        </Link>
        <nav className="main-nav" aria-label="Primary" ref={navRef}>
          <Link to="/">Home</Link>
          <NavMegaItem label="Tools" id="tools" openMenu={openMenu} setOpenMenu={setOpenMenu}>
            <ToolsMegaMenu onNavigate={closeMenu} />
          </NavMegaItem>
          <Link to="/categories">Categories</Link>
          <NavMegaItem label="Blog" id="blog" openMenu={openMenu} setOpenMenu={setOpenMenu}>
            <BlogMegaMenu onNavigate={closeMenu} />
          </NavMegaItem>
          <Link to="/tools?f=popular">Popular</Link>
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
          {MOBILE_NAV_LINKS.map(([href, label]) => (
            <Link key={href} to={href} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
