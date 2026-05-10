// Exact replica of the toggle switch from AuraLink screenshots
export default function ToggleSwitch({ checked, onChange, showLabel = true, size = 'md' }) {
  const w = size === 'sm' ? 42 : 52;
  const h = size === 'sm' ? 24 : 28;
  const thumb = size === 'sm' ? 18 : 22;
  const travel = w - thumb - 6;

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ width: w, height: h, borderRadius: h / 2 }}
      className={`relative flex-shrink-0 transition-colors duration-200 focus:outline-none
        ${checked ? 'bg-al-green' : 'bg-[#94a3b8]'}`}
      aria-checked={checked}
    >
      {/* "ON" text inside track */}
      {showLabel && checked && (
        <span className="absolute left-2 text-white font-bold"
              style={{ fontSize: size === 'sm' ? 8 : 9, top: '50%', transform: 'translateY(-50%)' }}>
          ON
        </span>
      )}
      {/* Thumb */}
      <span
        style={{
          width: thumb, height: thumb,
          top: (h - thumb) / 2,
          left: (h - thumb) / 2,
          transform: checked ? `translateX(${travel}px)` : 'translateX(0)',
          transition: 'transform 0.2s',
          borderRadius: '50%',
          position: 'absolute',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      />
    </button>
  );
}
