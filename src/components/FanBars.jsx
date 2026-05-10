// Fan speed signal-strength bars — exactly as shown in screenshots
// level: 0-4 (how many bars are filled)
export default function FanBars({ level = 2, size = 'md' }) {
  const barCount = 5;
  const heights  = size === 'sm'
    ? [8, 12, 16, 20, 24]
    : [10, 15, 20, 26, 32];
  const width    = size === 'sm' ? 6 : 8;
  const gap      = size === 'sm' ? 3 : 4;

  return (
    <div className="flex items-end" style={{ gap }}>
      {Array.from({ length: barCount }, (_, i) => (
        <div
          key={i}
          style={{ width, height: heights[i] }}
          className={`rounded-sm transition-colors ${
            i < level ? 'bg-al-bar-on' : 'bg-al-bar-off'
          }`}
        />
      ))}
    </div>
  );
}
