// EvidentX brand mark.
// Concept: a hexagonal credential badge (trust / verifiable credential)
// containing a checkmark whose stem connects into a matching node.
// Representing verified evidence linked through explainable matching.

type LogoProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 36, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="evx-grad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2d63e8" />
          <stop offset="1" stopColor="#1d387f" />
        </linearGradient>
      </defs>
      {/* Hexagon credential badge */}
      <path
        d="M24 3.5 41.7 13.75v20.5L24 44.5 6.3 34.25v-20.5L24 3.5Z"
        fill="url(#evx-grad)"
      />
      {/* Graduation cap notch */}
      <path
        d="M24 9.2 33 14 24 18.8 15 14 24 9.2Z"
        fill="#ffffff"
        fillOpacity="0.92"
      />
      <path
        d="M18 16.4v3.2c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-3.2"
        stroke="#ffffff"
        strokeOpacity="0.92"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Checkmark = verified evidence */}
      <path
        d="M16.5 30.5 21 35l10.5-11"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Matching node */}
      <circle cx="33" cy="24.5" r="2.4" fill="#38a881" />
    </svg>
  );
}

export function Logo({
  size = 36,
  showText = true,
  tagline = 'Verified Skills · Explainable Matching',
  className = '',
}: {
  size?: number;
  showText?: boolean;
  tagline?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <div className="text-left leading-tight">
          <div className="font-display text-base font-bold tracking-tight text-ink-900">EvidentX</div>
          {tagline && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{tagline}</div>
          )}
        </div>
      )}
    </div>
  );
}
