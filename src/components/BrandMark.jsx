// The Toolworks logomark: a "T" built from two rounded bars (on-brand with
// the site's rounded-square/pill visual language), on the same blue gradient
// used by .btn-primary, with a copper accent chip pulling in the site's
// secondary brand color. Doubles as the browser favicon (public/favicon.svg).
export default function BrandMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tw-badge" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1949B8" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#tw-badge)" />
      <rect x="7.5" y="9" width="17" height="4.6" rx="2.3" fill="#FFFFFF" />
      <rect x="13.7" y="9" width="4.6" height="16" rx="2.3" fill="#FFFFFF" />
      <circle cx="16" cy="18.4" r="1.5" fill="#1949B8" />
      <circle cx="25.5" cy="7.5" r="2.6" fill="#B5651D" />
    </svg>
  );
}
