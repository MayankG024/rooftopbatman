// Arkham-style gold bat emblem — original vector, built for black backdrops.
// Inspired by the user's logo: a wide, sharp-winged bat in brushed gold.
interface BatLogoProps {
  size?: number;
  glow?: boolean;
  className?: string;
}

export function BatLogo({ size = 88, glow = true, className = '' }: BatLogoProps) {
  const gid = 'batgold';
  return (
    <svg
      width={size}
      height={size * 0.42}
      viewBox="0 0 120 50"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 18px rgba(229,169,60,0.55)) drop-shadow(0 0 46px rgba(229,169,60,0.25))' } : undefined}
      aria-label="Batman logo"
      role="img"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7d47a" />
          <stop offset="38%" stopColor="#e5a93c" />
          <stop offset="72%" stopColor="#9a6410" />
          <stop offset="100%" stopColor="#5f3c07" />
        </linearGradient>
      </defs>
      {/* Wide Arkham wings with scalloped trailing edge */}
      <path
        d="M60 5.5
           L63.5 9.5 L70 8 L82 4.5 L92 3 L104 4.5 L117 9 L119.5 13.5
           L110 16 L112 20 L102 21 L100 25.5 L90 24 L88 28.5 L78 27 L74 31.5
           L67 37 L64 44.5 L60 40 L56 44.5 L53 37 L46 31.5 L42 27 L32 28.5
           L30 24 L20 25.5 L18 21 L8 20 L10 16 L0.5 13.5 L3 9 L16 4.5
           L28 3 L38 4.5 L50 8 L56.5 9.5 Z"
        fill={`url(#${gid})`}
        stroke="#2b1d05"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Brushed-metal highlight */}
      <path
        d="M8 12.5 L28 6.5 L50 10.5 L60 12 L70 10.5 L92 6.5 L112 12.5"
        fill="none"
        stroke="rgba(255,240,200,0.5)"
        strokeWidth="1"
      />
      {/* Head notch */}
      <path d="M56.5 9.5 L60 14 L63.5 9.5 L60 11 Z" fill="#0a0803" />
    </svg>
  );
}
