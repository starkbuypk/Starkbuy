export function StarkBuyLogo({ height = 36 }: { height?: number }) {
  const iconSize = height;
  const fontSize = Math.round(height * 0.5);

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: Math.round(height * 0.3) + 'px', flexShrink: 0 }}>
      <span style={{
        width: iconSize,
        height: iconSize,
        borderRadius: '50%',
        background: '#1a1614',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <img
          src="/brand-logo.png"
          alt="StarkBuy"
          width={Math.round(iconSize * 0.88)}
          height={Math.round(iconSize * 0.88)}
          style={{
            width: Math.round(iconSize * 0.88),
            height: Math.round(iconSize * 0.88),
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </span>
      <span style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: fontSize,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        display: 'block',
      }}>
        <span style={{ color: '#1A1A1A' }}>Stark</span><span style={{ color: '#C9A84C' }}>Buy</span>
      </span>
    </span>
  );
}
