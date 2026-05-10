// Small inline wave chart showing runtime data — matches screenshots
export default function MiniWaveChart({ runtime = '3h 15m', color = '#3b82f6', width = 120, height = 36 }) {
  // Deterministic wave path based on runtime string seed
  const seed  = runtime.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pts   = Array.from({ length: 12 }, (_, i) => {
    const x  = (i / 11) * width;
    const rn = Math.sin(i * 0.9 + seed * 0.01) * 0.4 + Math.cos(i * 1.7 + seed * 0.02) * 0.3;
    const y  = height * 0.5 + rn * height * 0.35;
    return [x, y];
  });

  const linePath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath  = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={`wg-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#wg-${seed})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
