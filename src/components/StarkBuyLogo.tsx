export function StarkBuyLogo({ height = 36 }: { height?: number }) {
  const scale = height / 36;
  const w = Math.round(160 * scale);
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 160 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="StarkBuy"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Bag icon */}
      <g transform="translate(0, 2)">
        <path d="M11 8 Q11 3 17 3 Q23 3 23 8" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M6 8 L4 28 Q4 30 6 30 L28 30 Q30 30 30 28 L28 8 Z" fill="#1A1A1A"/>
        <path d="M7 8 L27 8 L24 20 L6 14 Z" fill="rgba(255,255,255,0.08)"/>
        <path d="M6 14 L24 20 L28 28 Q28 30 26 30 L6 30 Q4 30 4 28 Z" fill="rgba(0,0,0,0.35)"/>
        <path d="M9 11 L22 11" stroke="rgba(201,168,76,0.50)" strokeWidth="1" strokeLinecap="round"/>
      </g>
      {/* StarkBuy — one joined wordmark */}
      <text
        x="38"
        y="26"
        fontFamily="'DM Sans', system-ui, sans-serif"
        fontWeight="700"
        fontSize="18"
        letterSpacing="-0.03em"
      >
        <tspan fill="#1A1A1A">Stark</tspan><tspan fill="#C9A84C">Buy</tspan>
      </text>
    </svg>
  );
}
