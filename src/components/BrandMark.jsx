import { useId } from 'react';

// The Oxvid Tools logomark: an "OX" ligature (open ring + crossing bars),
// echoing the parent Oxvid Systems logo's O+X construction and ascending
// accent dot, rendered in this site's own blue gradient (the same one used
// by .btn-primary) with a copper accent chip pulling in the site's
// secondary brand color. Doubles as the browser favicon (public/favicon.svg).
export default function BrandMark({ size = 26 }) {
  const gradientId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1949B8" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#${gradientId})`} />
      <circle cx="10.6" cy="16" r="5.6" fill="none" stroke="#FFFFFF" strokeWidth="3" />
      <rect
        x="18.3"
        y="8.6"
        width="3.1"
        height="15"
        rx="1.55"
        fill="#FFFFFF"
        transform="rotate(32 19.85 16.1)"
      />
      <rect
        x="18.3"
        y="8.6"
        width="3.1"
        height="15"
        rx="1.55"
        fill="#FFFFFF"
        transform="rotate(-32 19.85 16.1)"
      />
      <circle cx="25.6" cy="7.4" r="2.2" fill="#B5651D" />
    </svg>
  );
}
