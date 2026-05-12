import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Zap, Wind, ShieldCheck, Activity, Droplets,
  Power, CloudRain, Gauge, RefreshCw, Rocket, TrendingUp,
  Loader2, WifiOff, AlertTriangle, BarChart2, Settings,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { unitsApi } from '../services/api';
import { useWs } from '../context/WsContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────
const COST_RATE = parseFloat(localStorage.getItem('al_rate') || '0.136'); // $/kWh
const CURRENCY = localStorage.getItem('al_currency') || 'USD';

// ── Fan helpers ───────────────────────────────────────────────
const levelToStr = n => n <= 1 ? 'low' : n <= 3 ? 'medium' : 'high';
const strToLevel = s => ({ auto: 2, low: 1, medium: 3, high: 5 }[s] || 2);

// ── Chart data ────────────────────────────────────────────────
const makeChart = (log) => {
  if (log?.length >= 3) {
    return log.slice(-24).map(e => ({
      name: new Date(e.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
      power: +(e.powerWatts / 1000).toFixed(2),
      cost: +((e.energyKwh || 0) * COST_RATE).toFixed(4),
    }));
  }
  return [
    { name: '00:00', power: 0.8 }, { name: '02:00', power: 0.5 }, { name: '04:00', power: 0.4 },
    { name: '06:00', power: 0.7 }, { name: '08:00', power: 1.2 }, { name: '10:00', power: 2.1 },
    { name: '12:00', power: 2.4 }, { name: '14:00', power: 2.2 }, { name: '16:00', power: 1.8 },
    { name: '18:00', power: 1.5 }, { name: '20:00', power: 0.9 }, { name: '22:00', power: 0.6 },
  ];
};

// ── Sub-components ────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, unit, color, trend, live }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex flex-col items-end gap-1">
        {live && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />LIVE
          </span>
        )}
        {trend != null && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
            ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-black text-slate-800">{value ?? '—'}</span>
      <span className="text-xs font-bold text-slate-400">{unit}</span>
    </div>
  </motion.div>
);

const FeatureToggle = ({ active, onClick, icon: Icon, label, saving }) => (
  <div className="flex flex-col gap-2">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</p>
    <button
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-300
        ${active
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon size={20} className={active ? 'animate-pulse' : ''} />
      <span className="text-xs font-black uppercase tracking-tighter">
        {saving ? '...' : active ? 'Active' : 'Disabled'}
      </span>
    </button>
  </div>
);

const StaircaseFan = ({ speed, setSpeed }) => (
  <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Wind size={16} className="text-indigo-500" />
        <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Fan Velocity</p>
      </div>
      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
        Level {speed}
      </span>
    </div>
    <div className="flex items-end gap-2 h-20">
      {[1, 2, 3, 4, 5, 6].map(level => (
        <button
          key={level}
          onClick={() => setSpeed(level)}
          className={`flex-1 rounded-xl transition-all duration-500 hover:opacity-80
            ${speed >= level ? 'bg-indigo-500' : 'bg-slate-200'}`}
          style={{ height: `${30 + level * 10}%` }}
        />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
export default function DetailPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { patch, clearPatch } = useWs();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  // Controls
  const [power, setPower] = useState(false);
  const [setTemp, setSetTemp] = useState(22);
  const [fanSpd, setFanSpd] = useState(3);
  const [mode, setMode] = useState('cool');
  const [swing, setSwing] = useState(false);
  const [turbo, setTurbo] = useState(false);

  // Live sensor data
  const [roomTemp, setRoomTemp] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [voltage, setVoltage] = useState(null);
  const [current, setCurrent] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [watts, setWatts] = useState(null);
  const [energyToday, setEnergyToday] = useState(0);
  const [energyMonth, setEnergyMonth] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [chartData, setChartData] = useState([]);

  // ── Fetch unit from MongoDB ──────────────────────────────
  useEffect(() => {
    if (!unitId || unitId === 'unknown') { navigate('/'); return; }
    setLoading(true);
    unitsApi.get(unitId)
      .then(({ data }) => {
        const u = data.data;
        setUnit(u);
        // Controls from desiredState
        setPower(u.desiredState?.power ?? false);
        setSetTemp(u.desiredState?.temperature ?? 22);
        setFanSpd(strToLevel(u.desiredState?.fanSpeed));
        setMode(u.desiredState?.mode ?? 'cool');
        setSwing(u.desiredState?.swing ?? false);
        setTurbo(u.desiredState?.turbo ?? false);
        // Sensor data
        const s = u.sensorData || {};
        setRoomTemp(s.roomTemperature ?? null);
        setHumidity(s.roomHumidity ?? null);
        setVoltage(s.voltage ?? null);
        setCurrent(s.current ?? null);
        setFrequency(s.frequency ?? null);
        setWatts(s.powerWatts ?? null);
        setEnergyToday(s.energyToday ?? 0);
        setEnergyMonth(s.energyMonth ?? 0);
        setIsOnline(u.isOnline ?? false);
        setChartData(makeChart(u.consumptionLog));
      })
      .catch(() => { toast.error('Could not load unit'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [unitId, navigate]);

  // ── WebSocket live sensor patches ────────────────────────
  useEffect(() => {
    if (!patch) return;
    if (patch.unitId !== unitId) { clearPatch(); return; }

    if (patch.type === 'SENSOR_UPDATE') {
      const p = patch.payload || {};
      if (p.roomTemperature != null) setRoomTemp(p.roomTemperature);
      if (p.roomHumidity != null) setHumidity(p.roomHumidity);
      if (p.voltage != null) setVoltage(p.voltage);
      if (p.current != null) setCurrent(p.current);
      if (p.frequency != null) setFrequency(p.frequency);
      if (p.powerWatts != null) setWatts(p.powerWatts);
      if (p.energyToday != null) setEnergyToday(p.energyToday);
      if (p.energyMonth != null) setEnergyMonth(p.energyMonth);
      // Append to chart
      setChartData(prev => {
        const time = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
        const entry = { name: time, power: +((p.powerWatts || 0) / 1000).toFixed(2) };
        const updated = [...prev.slice(-23), entry];
        return updated;
      });
    }
    if (patch.type === 'DEVICE_ONLINE') setIsOnline(true);
    if (patch.type === 'STATE_UPDATED') {
      const ds = patch.payload || {};
      if (ds.power != null) setPower(ds.power);
      if (ds.temperature != null) setSetTemp(ds.temperature);
      if (ds.mode != null) setMode(ds.mode);
      if (ds.fanSpeed != null) setFanSpd(strToLevel(ds.fanSpeed));
      if (ds.swing != null) setSwing(ds.swing);
      if (ds.turbo != null) setTurbo(ds.turbo);
    }
    clearPatch();
  }, [patch, unitId, clearPatch]);

  // ── Send update to backend ───────────────────────────────
  const send = useCallback(async (key, patch) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await unitsApi.setState(unitId, patch);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed — command queued');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  }, [unitId]);

  const handlePower = () => { const n = !power; setPower(n); send('power', { power: n }); };
  const handleTemp = (d) => { const n = setTemp + d; if (n < 16 || n > 30) return; setSetTemp(n); send('temp', { temperature: n }); };
  const handleFan = (l) => { setFanSpd(l); send('fan', { fanSpeed: levelToStr(l) }); };
  const handleMode = (m) => { setMode(m); send('mode', { mode: m }); };
  const handleSwing = () => { const n = !swing; setSwing(n); send('swing', { swing: n }); };
  const handleTurbo = () => { const n = !turbo; setTurbo(n); send('turbo', { turbo: n }); };

  // ── Computed costs ───────────────────────────────────────
  const todayCost = (energyToday * COST_RATE).toFixed(2);
  const monthCost = (energyMonth * COST_RATE).toFixed(2);
  const liveWattStr = watts != null ? watts.toFixed(0) : '—';

  // ── System health ────────────────────────────────────────
  const healthOk = isOnline && voltage != null && voltage > 200;
  const healthMsg = !isOnline ? 'Device offline — using cached data'
    : voltage && (voltage < 200 || voltage > 260) ? 'Voltage out of normal range!'
      : 'All components operating normally.';

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold text-sm">Loading unit data…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-800">{unit?.name}</h1>
                  <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full
                    ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isOnline
                      ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />ONLINE</>
                      : <><WifiOff size={10} />OFFLINE</>}
                  </span>
                </div>
                <p className="text-slate-400 font-bold text-sm flex items-center gap-2 mt-1">
                  <CloudRain size={14} />
                  {unit?.location || 'Unknown location'} · {unit?.brand || 'AC Unit'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/analytics')}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors text-xs font-black uppercase tracking-widest">
                <BarChart2 size={16} /> Analytics
              </button>
              <button onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors text-xs font-black uppercase tracking-widest">
                <Settings size={16} /> Settings
              </button>
              {/* Power button */}
              <button
                onClick={handlePower}
                disabled={saving.power}
                className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] border transition-all
                  ${power
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600'}
                  disabled:opacity-60`}
              >
                {saving.power ? <Loader2 size={20} className="animate-spin" /> : <Power size={20} />}
                <span className="font-black uppercase tracking-widest text-xs">
                  {power ? 'System Running' : 'System Standby'}
                </span>
              </button>
            </div>
          </header>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left: controls + chart ── */}
            <main className="lg:col-span-8 space-y-8">

              {/* Temperature + Fan + Modes card */}
              <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 border border-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                  {/* Temperature display */}
                  <div className="text-center md:text-left space-y-8">
                    <div>
                      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        Indoor Temperature
                      </p>
                      <div className="relative inline-block">
                        <span className="text-[8rem] md:text-[10rem] leading-none font-black text-slate-900 tracking-tighter">
                          {roomTemp != null ? Math.round(roomTemp) : '—'}
                        </span>
                        <span className="absolute top-6 md:top-8 -right-6 md:-right-8 text-5xl md:text-6xl font-black text-indigo-600">°</span>
                      </div>
                      {watts != null && (
                        <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-1">
                          <Zap size={14} className="text-amber-500" /> {liveWattStr} W live
                        </p>
                      )}
                    </div>

                    {/* Target temp +/- */}
                    <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 inline-flex">
                      <button
                        onClick={() => handleTemp(-1)}
                        disabled={saving.temp || setTemp <= 16}
                        className="w-14 h-14 bg-white rounded-2xl shadow-sm text-2xl font-light text-slate-600
                                   hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >−</button>
                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Target</p>
                        <p className="text-3xl font-black text-slate-800">
                          {saving.temp ? <Loader2 size={20} className="animate-spin inline text-indigo-500" /> : `${setTemp}°`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleTemp(+1)}
                        disabled={saving.temp || setTemp >= 30}
                        className="w-14 h-14 bg-white rounded-2xl shadow-sm text-2xl font-light text-slate-600
                                   hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >+</button>
                    </div>
                  </div>

                  {/* Fan + Mode */}
                  <div className="space-y-6">
                    <StaircaseFan speed={fanSpd} setSpeed={l => { setFanSpd(l); handleFan(l); }} />

                    <div className="grid grid-cols-2 gap-3">
                      {['cool', 'heat', 'dry', 'auto'].map(m => (
                        <button
                          key={m}
                          onClick={() => handleMode(m)}
                          disabled={saving.mode}
                          className={`py-4 rounded-2xl font-black text-sm border transition-all capitalize
                            ${mode === m
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}
                            disabled:opacity-60`}
                        >{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Load Profile chart */}
              <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Load Profile</h3>
                  <span className="text-xs font-bold text-slate-400">
                    Today · {energyToday.toFixed(2)} kWh · ${todayCost}
                  </span>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={v => `${v}kW`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                        formatter={v => [`${v} kW`, 'Power']}
                      />
                      <Area type="monotone" dataKey="power" stroke="#6366f1" strokeWidth={3}
                        fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </main>

            {/* ── Right sidebar ── */}
            <aside className="lg:col-span-4 space-y-6">

              {/* Turbo + Swing */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm grid grid-cols-2 gap-4">
                <FeatureToggle label="Turbo" active={turbo} onClick={handleTurbo} icon={Rocket} saving={saving.turbo} />
                <FeatureToggle label="Swing" active={swing} onClick={handleSwing} icon={RefreshCw} saving={saving.swing} />
              </div>

              {/* Electrical stat cards — LIVE from ESP */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard icon={Gauge} label="Voltage" value={voltage?.toFixed(1) ?? '—'} unit="V" color="bg-blue-600" live={isOnline && voltage != null} />
                <StatCard icon={Activity} label="Frequency" value={frequency?.toFixed(2) ?? '—'} unit="Hz" color="bg-purple-600" live={isOnline && frequency != null} />
                <StatCard icon={Zap} label="Current" value={current?.toFixed(2) ?? '—'} unit="A" color="bg-amber-500" live={isOnline && current != null} trend={current != null ? 5 : null} />
                <StatCard icon={Droplets} label="Humidity" value={humidity?.toFixed(0) ?? '—'} unit="%" color="bg-cyan-500" live={isOnline && humidity != null} />
              </div>

              {/* Power Consumption dark card */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black tracking-tight text-lg">Power Consumption</h3>
                    <TrendingUp className="text-indigo-400" size={20} />
                  </div>

                  {/* Today */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Today's Usage</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">{energyToday.toFixed(2)}</span>
                      <span className="text-sm font-bold text-slate-500">kWh</span>
                      <span className="text-sm font-bold text-emerald-400 ml-1">${todayCost}</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 w-full" />

                  {/* Monthly */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Usage (Month)</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{energyMonth.toFixed(1)}</span>
                      <span className="text-sm font-bold text-slate-500">kWh</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 w-full" />

                  {/* Monthly cost */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Monthly Cost</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-emerald-400">${monthCost}</span>
                      <span className="text-sm font-bold text-slate-500">{CURRENCY}</span>
                    </div>
                  </div>

                  {/* Rate note */}
                  <p className="text-[10px] text-slate-600">Rate: ${COST_RATE}/kWh · Change in Settings</p>
                </div>
              </div>

              {/* System health */}
              <div className={`border rounded-[2rem] p-6 flex items-center gap-4
                ${healthOk ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className={`p-3 rounded-2xl text-white shadow-lg
                  ${healthOk ? 'bg-indigo-600' : 'bg-amber-500'}`}>
                  {healthOk ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-tight
                    ${healthOk ? 'text-indigo-900' : 'text-amber-900'}`}>System Status</p>
                  <p className={`text-[10px] font-bold
                    ${healthOk ? 'text-indigo-600' : 'text-amber-700'}`}>{healthMsg}</p>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
