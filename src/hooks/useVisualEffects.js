import { useEffect } from 'react';

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initScrollReveal(root) {
  const targets = root.querySelectorAll('.tool-card, .cat-card');
  if (!targets.length) return;
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    if (REDUCED_MOTION) {
      el.classList.add('in');
      return;
    }
    el.style.transitionDelay = (Math.min(i % 10, 10) * 30) + 'ms';
  });
  if (REDUCED_MOTION || typeof IntersectionObserver === 'undefined') return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
  );
  targets.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

function initCountUps(root) {
  const targets = root.querySelectorAll('.count-up');
  targets.forEach((el) => {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (REDUCED_MOTION) {
      el.textContent = target;
      return;
    }
    const start = performance.now();
    const dur = 900;
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Runs the scroll-reveal + counter animations against `rootRef` whenever
// `deps` changes (typically the route). Skips everything under
// prefers-reduced-motion, matching the original site's behavior.
export function useRevealEffects(rootRef, deps) {
  useEffect(() => {
    if (!rootRef.current) return;
    const cleanup = initScrollReveal(rootRef.current);
    initCountUps(rootRef.current);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Card tilt-on-hover, delegated to one document-level listener. Skipped for
// touch devices (no meaningful hover) and when the user prefers less motion.
// Wired once for the lifetime of the app.
export function useCardTilt() {
  useEffect(() => {
    if (REDUCED_MOTION || 'ontouchstart' in window) return;
    let ticking = false;
    let lastEvent = null;
    function onMouseMove(e) {
      lastEvent = e;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const card = lastEvent.target.closest
          ? lastEvent.target.closest('.tool-card, .cat-card')
          : null;
        document.querySelectorAll('.tilting').forEach((el) => {
          if (el !== card) {
            el.classList.remove('tilting');
            el.style.transform = '';
          }
        });
        if (card) {
          card.classList.add('tilting');
          const r = card.getBoundingClientRect();
          const px = (lastEvent.clientX - r.left) / r.width;
          const py = (lastEvent.clientY - r.top) / r.height;
          const rotY = (px - 0.5) * 8;
          const rotX = (0.5 - py) * 8;
          card.style.transform = `perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
        }
        ticking = false;
      });
    }
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);
}
