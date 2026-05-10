import { Wind, Grid2x2, Bell, ChevronDown, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWs }   from '../context/WsContext';

export default function Navbar({ units = [], onAdd, searchVal, onSearch }) {
  const { user, logout } = useAuth();
  const { connected }    = useWs();

  const activeCount   = units.filter(u => u.desiredState?.power && u.isOnline).length;
  const avgTemp       = units.length
    ? (units.reduce((s, u) => s + (u.sensorData?.roomTemperature || u.desiredState?.temperature || 22), 0) / units.length).toFixed(0)
    : '—';

  return (
    <header className="bg-white border-b border-al-border shadow-nav z-40 flex-shrink-0">
      {/* ── Top strip: logo + stats + user ── */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-al-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <Wind size={15} className="text-white" />
          </div>
          <span className="font-bold text-al-text text-base tracking-tight">AuraLink Global</span>
          {/* WS dot */}
          <span className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full ml-1 ${connected ? 'bg-al-green animate-pulse' : 'bg-al-muted'}`} />
        </div>

        {/* Stats bar (desktop) */}
        <div className="hidden lg:flex items-center gap-6 text-center">
          <Stat icon={<Grid2x2 size={14} className="text-al-navy"/>} label="Total Active ACs" value={activeCount} />
          <div className="w-px h-8 bg-al-border" />
          <Stat icon={<span className="text-al-navy text-xs">⚡</span>} label="Total Energy Consu. Today" value="12.5 kWh" />
          <div className="w-px h-8 bg-al-border" />
          <Stat icon={<span className="text-al-navy text-xs">🌡</span>} label="Average Home Temp" value={`${avgTemp}°C`} />
        </div>

        {/* Right: add + user */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-al-navy text-white
                       text-sm font-semibold hover:bg-al-navy-lt transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add New AC Unit</span>
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-al-border text-al-sub hover:bg-al-bg transition-colors">
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-al-green" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-xl hover:bg-al-bg px-1.5 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-al-navy flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <ChevronDown size={13} className="text-al-muted" />
          </button>
        </div>
      </div>

      {/* ── Search bar row ── */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-2xl">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-al-muted" />
          <input
            value={searchVal}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-al-bg border border-al-border rounded-xl pl-9 pr-4 py-2 text-sm
                       text-al-text placeholder-al-muted outline-none focus:border-al-navy/40 transition-colors"
          />
        </div>
        {/* Mobile stat chips */}
        <div className="flex lg:hidden items-center gap-2 text-xs text-al-sub font-medium">
          <span className="px-2 py-1 bg-al-bg border border-al-border rounded-lg">{activeCount} active</span>
          <span className="px-2 py-1 bg-al-bg border border-al-border rounded-lg">{avgTemp}°C avg</span>
        </div>
      </div>
    </header>
  );
}

const Stat = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    {icon}
    <div className="text-left">
      <div className="text-[10px] text-al-muted leading-none">{label}</div>
      <div className="text-sm font-bold text-al-text leading-tight">{value}</div>
    </div>
  </div>
);
