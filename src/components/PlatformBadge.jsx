import { PLATFORM_META } from '../core/engine-core.js';

// React port of the original platformBadge(): a colored letter/glyph chip
// representing a keyword-research platform (Google, YouTube, Bing, ...).
export default function PlatformBadge({ name, size = 26 }) {
  const m = PLATFORM_META[name] || { bg: '#666', fg: '#fff', glyph: name[0] };
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.46),
    background: m.bg,
    color: m.fg,
    ...(m.border
      ? {
          boxShadow:
            'inset 0 0 0 1px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.6)',
        }
      : {}),
  };
  return (
    <span className="plat-badge" style={style}>
      {m.glyph}
    </span>
  );
}
