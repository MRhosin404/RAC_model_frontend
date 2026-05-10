import { useState, useCallback } from 'react';
import { Power, Droplets, Wind, Flame, Loader2, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { unitsApi } from '../services/api';
import toast from 'react-hot-toast';

// ── Runtime wave SVG ─────────────────────────────────────────
const RuntimeGraph = ({ color = '#3b82f6' }) => (
  <svg width="120" height="30" viewBox="0 0 120 30">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={color} stopOpacity="0.4" />
        <stop offset="100%" stopColor={color} stopOpacity="0"   />
      </linearGradient>
    </defs>
    <path
      d="M0 25 Q15 20 30 22 T60 15 T90 18 T120 5"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
    />
    <path
      d="M0 25 Q15 20 30 22 T60 15 T90 18 T120 5 L120 30 L0 30 Z"
      fill="url(#grad)"
    />
  </svg>
);

// ── Mode button ───────────────────────────────────────────────
const ModeBtn = ({ mode, label, icon: Icon, activeMode, color, bg, onClick }) => {
  const isActive = activeMode === mode;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className={`p-2 rounded-lg transition-all duration-200
        ${isActive ? `${bg} ${color}` : 'text-gray-400 hover:bg-gray-50'}`}>
        <Icon size={18} />
      </div>
      <span className={`text-[10px] font-bold transition-colors
        ${isActive ? color : 'text-gray-400'}`}>{label}</span>
    </button>
  );
};

// ── Mini feature toggle ───────────────────────────────────────
const MiniToggle = ({ checked, onColor, onClick }) => (
  <button
    onClick={onClick}
    className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0
      ${checked ? onColor : 'bg-gray-200'}`}
  >
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200
      ${checked ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
);

// ── Header power toggle ───────────────────────────────────────
const MainToggle = ({ checked }) => (
  <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 pr-3">
    <div className={`w-10 h-6 rounded-full transition-all relative
      ${checked ? 'bg-blue-500' : 'bg-white shadow-sm'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200
        ${checked ? 'left-5 bg-white' : 'left-1 bg-gray-300'}`} />
    </div>
    <span className="text-[10px] font-bold text-gray-500 uppercase">
      {checked ? 'ON' : 'OFF'}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// ACUnitCard — exact design from your code + MongoDB dynamic data
// ─────────────────────────────────────────────────────────────
export default function ACUnitCard({ unit, onUpdated }) {
  const navigate = useNavigate();

  // Map MongoDB data → local state
  const [isOn,       setIsOn]       = useState(unit?.desiredState?.power ?? false);
  const [activeMode, setActiveMode] = useState(mapMode(unit?.desiredState?.mode));
  const [swing,      setSwing]      = useState(unit?.desiredState?.swing ?? false);
  const [turbo,      setTurbo]      = useState(unit?.desiredState?.turbo ?? false);
  const [saving,     setSaving]     = useState(false);

  // Dynamic data from MongoDB
  const roomName   = unit?.name     || unit?.location || 'UNKNOWN ROOM';
  const unitId     = unit?._id      || 'unknown';
  const isOnline   = unit?.isOnline ?? false;
  const runtime    = unit?.runtime  || '3h 15m';
  const brand      = unit?.brand    || '';

  // Real sensor temp > desired temp > default 24
  const displayTemp =
    unit?.sensorData?.roomTemperature != null
      ? Math.round(unit.sensorData.roomTemperature)
      : (unit?.desiredState?.temperature ?? 24);

  const setTo = unit?.desiredState?.temperature ?? null;
  const humidity = unit?.sensorData?.roomHumidity ?? null;

  // ── Send update to backend (optimistic) ──────────────────
  const sendUpdate = useCallback(async (patch) => {
    setSaving(true);
    try {
      await unitsApi.setState(unitId, patch);
      onUpdated?.({ ...unit, desiredState: { ...unit?.desiredState, ...patch } });
    } catch (err) {
      // Rollback
      setIsOn(unit?.desiredState?.power ?? false);
      setActiveMode(mapMode(unit?.desiredState?.mode));
      setSwing(unit?.desiredState?.swing ?? false);
      setTurbo(unit?.desiredState?.turbo ?? false);
      toast.error(
        isOnline
          ? (err.response?.data?.message || 'Update failed')
          : 'Device offline — command queued ⏳'
      );
    } finally {
      setSaving(false);
    }
  }, [unit, unitId, onUpdated, isOnline]);

  // Stop propagation so card click doesn't fire when pressing buttons
  const stop = (e, fn) => { e.stopPropagation(); fn(); };

  const handlePower = (e) => stop(e, () => {
    const next = !isOn;
    setIsOn(next);
    sendUpdate({ power: next });
  });

  const handleMode = (e, mode) => stop(e, () => {
    setActiveMode(mode);
    // Map display label → backend value
    const backendMode = { ON:'cool', COOL:'cool', HEAT:'heat', FAN:'fan' }[mode] || 'cool';
    sendUpdate({ mode: backendMode });
  });

  const handleSwing = (e) => stop(e, () => {
    const next = !swing;
    setSwing(next);
    sendUpdate({ swing: next });
  });

  const handleTurbo = (e) => stop(e, () => {
    const next = !turbo;
    setTurbo(next);
    sendUpdate({ turbo: next });
  });

  const graphColor = isOn ? '#3b82f6' : '#9ca3af';

  return (
    <div
      onClick={() => navigate(`/detail/${unitId}`)}
      className={`bg-white rounded-[2rem] p-6 shadow-sm border font-sans
        max-w-[420px] w-full cursor-pointer select-none
        transition-all duration-300
        ${isOnline
          ? 'border-gray-100 hover:shadow-lg hover:border-blue-100'
          : 'border-gray-100 hover:shadow-md'}`}
    >

      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight truncate">
            {roomName}
          </h2>

          {/* Offline badge */}
          {!isOnline && (
            <span className="flex items-center gap-1 text-[9px] font-bold
                             text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
              <WifiOff size={9} /> OFFLINE
            </span>
          )}

          {/* Saving indicator */}
          {saving && (
            <Loader2 size={12} className="text-blue-400 animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Power toggle — click area isolated */}
        <div onClick={handlePower} className="flex-shrink-0">
          <MainToggle checked={isOn} />
        </div>
      </div>

      {/* ── Temperature + Runtime Graph ── */}
      <div className="flex justify-between items-center mb-6 gap-4">
        {/* Temp */}
        <div>
          <div className="text-6xl font-bold text-gray-900 leading-none">
            {displayTemp}
            <span className="text-4xl font-bold">°C</span>
          </div>

          {/* "Set to X°C" — only if sensor and desired differ */}
          {setTo != null &&
           unit?.sensorData?.roomTemperature != null &&
           Math.round(unit.sensorData.roomTemperature) !== setTo && (
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Set to {setTo}°C
            </p>
          )}

          {/* Humidity */}
          {humidity != null && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              💧 {Math.round(humidity)}% humidity
            </p>
          )}
        </div>

        {/* Runtime + graph */}
        <div className="flex flex-col items-end gap-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            RUNTIME: {runtime}
          </p>
          <RuntimeGraph color={graphColor} />
          {brand && (
            <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest">
              {brand}
            </span>
          )}
        </div>
      </div>

      {/* ── Modes + Feature Toggles ── */}
      <div className="flex justify-between items-end gap-4">

        {/* Modes */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modes</p>
          <div className="flex gap-3">
            <ModeBtn mode="ON"   label="ON"   icon={Power}    activeMode={activeMode}
              color="text-green-600"  bg="bg-green-100"
              onClick={(e) => handleMode(e, 'ON')} />
            <ModeBtn mode="COOL" label="COOL" icon={Droplets} activeMode={activeMode}
              color="text-blue-600"   bg="bg-blue-100"
              onClick={(e) => handleMode(e, 'COOL')} />
            <ModeBtn mode="HEAT" label="HEAT" icon={Flame}    activeMode={activeMode}
              color="text-orange-500" bg="bg-orange-100"
              onClick={(e) => handleMode(e, 'HEAT')} />
            <ModeBtn mode="FAN"  label="FAN"  icon={Wind}     activeMode={activeMode}
              color="text-gray-600"   bg="bg-gray-100"
              onClick={(e) => handleMode(e, 'FAN')} />
          </div>
        </div>

        {/* Feature toggles */}
        <div className="space-y-2.5 min-w-[120px]">
          <div className="flex justify-between items-center gap-3">
            <span className="text-[10px] font-bold text-gray-700 uppercase">SWING</span>
            <MiniToggle checked={swing} onColor="bg-red-400"
              onClick={(e) => handleSwing(e)} />
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-[10px] font-bold text-gray-700 uppercase">TURBO</span>
            <MiniToggle checked={turbo} onColor="bg-green-500"
              onClick={(e) => handleTurbo(e)} />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0
            ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
          <span className={`text-[10px] font-semibold
            ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
            {isOnline ? 'Device Online' : 'Last recorded data'}
          </span>
        </div>
        <p className="text-[10px] text-blue-500 font-semibold hover:text-blue-600 transition-colors">
          Click Card to View Details →
        </p>
      </div>

    </div>
  );
}

// ── Map backend mode → display label ─────────────────────────
function mapMode(m) {
  return { cool:'COOL', heat:'HEAT', fan:'FAN', dry:'COOL', auto:'ON' }[m] || 'ON';
}
