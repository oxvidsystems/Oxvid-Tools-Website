import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { useRevealEffects } from '../hooks/useVisualEffects.js';

export default function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto',
    });
  }, [location.pathname, location.search]);

  useRevealEffects(mainRef, [location.pathname, location.search]);

  return (
    <>
      <Header />
      <main ref={mainRef}>
        <Suspense fallback={<div className="route-loading" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <div id="toast" className="toast" role="status" aria-live="polite"></div>
    </>
  );
}
