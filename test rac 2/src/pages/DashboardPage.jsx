import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Loader2, Wind, BarChart2, Calendar, Bell, Settings, Home, Grid2x2 } from 'lucide-react';
import { unitsApi }    from '../services/api';
import { useWs }       from '../context/WsContext';
import { useAuth }     from '../context/AuthContext';
import ACUnitCard      from '../components/ACCard';
import AddUnitModal    from '../components/AddUnitModal';
import buildingSvg     from '../assets/building.svg';
import toast from 'react-hot-toast';

// ── Demo fallback (shown when backend is not connected) ───────
const DEMO = [
  { _id:'d1', name:'GUEST ROOM',    location:'Guest Room',    brand:'Daikin',    isOnline:true,  runtime:'3h 15m',
    desiredState:{ power:false, temperature:24, mode:'cool', fanSpeed:'auto',  swing:false, turbo:false },
    sensorData:{ roomTemperature:24, roomHumidity:55 }, commandQueue:[] },
  { _id:'d2', name:'KITCHEN',       location:'Kitchen',       brand:'Samsung',   isOnline:true,  runtime:'3h 15m',
    desiredState:{ power:false, temperature:25, mode:'heat', fanSpeed:'low',   swing:false, turbo:false },
    sensorData:{ roomTemperature:25, roomHumidity:62 }, commandQueue:[] },
  { _id:'d3', name:'MASTER BEDROOM',location:'Master Bedroom',brand:'LG',        isOnline:true,  runtime:'3h 15m',
    desiredState:{ power:true,  temperature:22, mode:'cool', fanSpeed:'high',  swing:false, turbo:false },
    sensorData:{ roomTemperature:22, roomHumidity:50 }, commandQueue:[] },
  { _id:'d4', name:'LIVING ROOM',   location:'Living Room',   brand:'Mitsubishi',isOnline:false, runtime:'3h 15m',
    desiredState:{ power:false, temperature:26, mode:'cool', fanSpeed:'auto',  swing:false, turbo:false },
    sensorData:{ roomTemperature:26, roomHumidity:60 }, commandQueue:[] },
  { _id:'d5', name:'STUDY ROOM',    location:'Study',         brand:'Panasonic', isOnline:true,  runtime:'3h 15m',
    desiredState:{ power:false, temperature:20, mode:'fan',  fanSpeed:'medium',swing:false, turbo:false },
    sensorData:{ roomTemperature:20, roomHumidity:48 }, commandQueue:[] },
  { _id:'d6', name:'DINING ROOM',   location:'Dining Room',   brand:'Daikin',    isOnline:false, runtime:'3h 15m',
    desiredState:{ power:false, temperature:23, mode:'cool', fanSpeed:'auto',  swing:false, turbo:false },
    sensorData:{ roomTemperature:23, roomHumidity:52 }, commandQueue:[] },
];

export default function DashboardPage() {
  const { user, logout }        = useAuth();
  const { patch, clearPatch }   = useWs();
  const [units,   setUnits]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [refresh, setRefresh]   = useState(false);

  // ── Fetch units from MongoDB ──────────────────────────────
  const fetchUnits = useCallback(async () => {
    try {
      const { data } = await unitsApi.list();
      setUnits(data.data?.length ? data.data : DEMO);
    } catch {
      setUnits(DEMO); // show demo cards if backend not reachable
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  // ── Apply WebSocket real-time patches ─────────────────────
  useEffect(() => {
    if (!patch) return;
    if (patch.type === 'REFETCH') {
      fetchUnits();
    } else if (patch.type === 'UNIT_PATCH') {
      setUnits(prev => prev.map(u =>
        u._id === patch.unitId ? { ...u, ...patch.update } : u
      ));
    }
    clearPatch();
  }, [patch, fetchUnits, clearPatch]);

  // ── Handle card updated locally (optimistic) ─────────────
  const handleUpdated = useCallback((updated) => {
    setUnits(prev => prev.map(u => u._id === updated._id ? updated : u));
  }, []);

  const handleDelete = useCallback((id) => {
    setUnits(prev => prev.filter(u => u._id !== id));
  }, []);

  const handleCreated = useCallback((newUnit) => {
    setUnits(prev => [...prev, newUnit]);
    setShowAdd(false);
    toast.success(`${newUnit.name} created!`);
  }, []);

  // ── Manual refresh ────────────────────────────────────────
  const handleRefresh = () => {
    setRefresh(true);
    fetchUnits();
  };

  // ── Search filter ─────────────────────────────────────────
  const filtered = units.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.location?.toLowerCase().includes(search.toLowerCase()) ||
    u.brand?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stats ─────────────────────────────────────────────────
  const onlineCount  = units.filter(u => u.isOnline).length;
  const activeCount  = units.filter(u => u.desiredState?.power && u.isOnline).length;
  const avgTemp      = units.length
    ? (units.reduce((s, u) => s + (u.sensorData?.roomTemperature ?? u.desiredState?.temperature ?? 22), 0) / units.length).toFixed(0)
    : '—';

  return (
    <div className="min-h-screen bg-[#eef1f6] flex flex-col font-sans">

      {/* ── Top Navbar ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-40">
        <div className="flex items-center justify-between px-5 h-14">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <Wind size={15} className="text-white" />
            </div>
            <span className="font-bold text-[#1e293b] text-base tracking-tight hidden sm:block">
              AuraLink Global
            </span>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6">
            <TopStat label="Total Active ACs"      value={activeCount} />
            <div className="w-px h-8 bg-gray-200" />
            <TopStat label="Total Energy Today"    value="12.5 kWh"    />
            <div className="w-px h-8 bg-gray-200" />
            <TopStat label="Average Home Temp"     value={`${avgTemp}°C`} />
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200
                         text-gray-500 hover:bg-gray-50 transition-colors">
              <RefreshCw size={15} className={refresh ? 'animate-spin text-blue-500' : ''} />
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e3a5f] text-white
                         text-sm font-semibold hover:bg-[#2d5082] transition-colors">
              <Plus size={14} />
              <span className="hidden sm:inline">Add New AC Unit</span>
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200
                         text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors">
              {user?.name?.split(' ')[0] || 'Logout'}
            </button>
          </div>
        </div>

        {/* Search row */}
        <div className="px-5 pb-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search AC units by name, location or brand..."
            className="w-full max-w-2xl bg-gray-50 border border-gray-200 rounded-xl
                       px-4 py-2 text-sm text-gray-700 placeholder-gray-400
                       outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="hidden md:flex flex-col items-center w-16 bg-white border-r border-gray-200 py-3 gap-1 flex-shrink-0">
          {[
            { Icon: Home,      label:'Home',          active:true  },
            { Icon: BarChart2, label:'Analytics'                   },
            { Icon: Calendar,  label:'Scheduling'                  },
            { Icon: Bell,      label:'Notifications'               },
            { Icon: Settings,  label:'Settings'                    },
          ].map(({ Icon, label, active }) => (
            <button key={label} title={label}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-0.5
                ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                transition-colors`}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[8px] font-medium">{label}</span>
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto relative">

          {/* Building background */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ left:64 }}>
            <img src={buildingSvg} alt=""
              className="absolute bottom-0 right-0 w-[85%] h-[85%] object-contain object-right-bottom opacity-50" />
          </div>

          {/* Card grid */}
          <div className="relative z-10 p-5 pb-32">

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 size={32} className="text-[#1e3a5f] animate-spin" />
                <p className="text-gray-500 text-sm font-medium">Fetching AC units from MongoDB…</p>
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Grid2x2 size={24} className="text-gray-400" />
                </div>
                <p className="font-bold text-gray-700">No AC units found</p>
                <p className="text-gray-400 text-sm">
                  {search ? `No results for "${search}"` : 'Add your first virtual AC card to get started'}
                </p>
                {!search && (
                  <button onClick={() => setShowAdd(true)}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white font-semibold text-sm
                               hover:bg-[#2d5082] transition-colors">
                    + Add New AC Unit
                  </button>
                )}
              </div>
            )}

            {/* Cards */}
            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((unit, i) => (
                  <div
                    key={unit._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <ACUnitCard
                      unit={unit}
                      onUpdated={handleUpdated}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bottom stats bar ── */}
          <div className="fixed bottom-14 left-16 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-200">
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              <BottomStat label="TOTAL ACTIVE ACs"              value={activeCount} />
              <BottomStat label="TOTAL ENERGY CONSUMED (Today)" value="12.5 kWh"   />
              <BottomStat label="AVERAGE HOME TEMP"             value={`${avgTemp}°C`} />
            </div>
            <p className="text-[9px] text-gray-400 text-center pb-1">
              Desktop Dashboard | MERN Stack + ESP8266 | Standard Style
            </p>
          </div>

          {/* ── Bottom tab bar ── */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
            <div className="flex items-center justify-around max-w-2xl mx-auto">
              {[
                { Icon: Home,      label:'Home',         active:true  },
                { Icon: BarChart2, label:'Analytics'                  },
                { Icon: Calendar,  label:'Scheduling'                 },
                { Icon: Bell,      label:'Notifications'              },
                { Icon: Settings,  label:'Settings'                   },
              ].map(({ Icon, label, active }) => (
                <button key={label}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2.5 flex-1
                    ${active ? 'text-[#1e3a5f]' : 'text-gray-400 hover:text-gray-600'}
                    transition-colors`}>
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Add Unit Modal */}
      {showAdd && (
        <AddUnitModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

const TopStat = ({ label, value }) => (
  <div className="text-center">
    <div className="text-[10px] text-gray-400 leading-none">{label}</div>
    <div className="text-sm font-bold text-[#1e293b] leading-tight mt-0.5">{value}</div>
  </div>
);

const BottomStat = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center py-2.5 px-2 text-center">
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className="text-xl font-bold text-[#1e293b] mt-0.5">{value}</span>
  </div>
);
