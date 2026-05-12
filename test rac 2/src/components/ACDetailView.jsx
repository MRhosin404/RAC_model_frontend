import { useState, useCallback } from 'react';
import { X, Wifi } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { unitsApi } from '../services/api';
import ToggleSwitch  from './ToggleSwitch';
import FanBars       from './FanBars';
import toast from 'react-hot-toast';

/* Runtime chart mock data */
const chartData = [
  { t:'0:00',h:0.5},{ t:'3:00',h:0.8},{ t:'6:00',h:1.2},{ t:'9:00',h:2.1},
  { t:'12:00',h:3.5},{ t:'15:00',h:5.8},{ t:'16:00',h:7.2},{ t:'17:00',h:8.5},
  { t:'18:00',h:6.1},{ t:'19:00',h:5.0},{ t:'20:00',h:3.8},{ t:'21:00',h:2.5},
];

const MODES = [
  { key:'cool', emoji:'❄️', label:'COOL', activeColor:'#3b82f6', activeBg:'#dbeafe' },
  { key:'heat', emoji:'🔥', label:'HEAT', activeColor:'#f59e0b', activeBg:'#fef3c7' },
  { key:'dry',  emoji:'💧', label:'DRY',  activeColor:'#0d9488', activeBg:'#ccfbf1' },
  { key:'fan',  emoji:'🌀', label:'FAN',  activeColor:'#8b5cf6', activeBg:'#ede9fe' },
];

const fanLevel = s => ({ auto:2, low:1, medium:3, high:5 }[s] || 2);

export default function ACDetailView({ unit, onClose, onSaved }) {
  const [ds, setDs]     = useState(unit.desiredState || {});
  const [saving, setSaving] = useState(false);

  const send = useCallback(async patch => {
    const next = { ...ds, ...patch };
    setDs(next);
    setSaving(true);
    try {
      await unitsApi.setState(unit._id, patch);
      onSaved?.({ ...unit, desiredState: next });
    } catch (err) {
      setDs(ds);
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }, [ds, unit._id]);

  const powered = !!ds.power;

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-card-lg animate-slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-al-border">
          <h2 className="font-bold text-al-text uppercase tracking-wider text-sm">
            {unit.name} AC <span className="text-al-muted font-normal">| DETAILED CONTROL</span>
          </h2>
          <div className="flex items-center gap-4 text-xs text-al-sub">
            <span className="flex items-center gap-1"><span className="font-bold text-al-text text-sm">🕐</span> Total Runtime Today <strong className="text-al-text ml-1">{unit.runtime || '3h 15m'}</strong></span>
            <span className="flex items-center gap-1"><span className="text-al-text">🌡</span> Average Daily Usage <strong className="text-al-text ml-1">12.5 kWh</strong></span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-al-bg text-al-muted hover:text-al-text transition-colors ml-2">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          {/* ── Left: main controls ── */}
          <div className="space-y-5">
            {/* Power toggle (large, centred) */}
            <div className="flex justify-center">
              <button
                onClick={() => send({ power: !powered })}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold text-base transition-all
                  ${powered ? 'bg-al-navy text-white' : 'bg-al-bg border border-al-border text-al-sub'}`}
              >
                <span>{powered ? 'ON' : 'OFF'}</span>
                <div className={`w-6 h-6 rounded-full border-2 ${powered ? 'border-white/60 bg-white/20' : 'border-al-border bg-white'}`} />
              </button>
            </div>

            {/* Temperature +/- */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => send({ temperature: Math.max(16, (ds.temperature ?? 22) - 1) })}
                className="w-12 h-12 rounded-2xl border-2 border-al-border text-al-text text-2xl font-bold hover:bg-al-bg transition-colors"
              >−</button>
              <div className="text-center">
                <div className="text-7xl font-bold text-al-text leading-none">{ds.temperature ?? 22}<span className="text-4xl">°C</span></div>
                <div className="text-xs text-al-sub mt-2 uppercase tracking-wider">Set to: {ds.temperature ?? 22}°C</div>
              </div>
              <button
                onClick={() => send({ temperature: Math.min(30, (ds.temperature ?? 22) + 1) })}
                className="w-12 h-12 rounded-2xl border-2 border-al-border text-al-text text-2xl font-bold hover:bg-al-bg transition-colors"
              >+</button>
            </div>

            {/* Fan speed */}
            <div>
              <p className="text-xs font-bold text-al-sub uppercase tracking-wider mb-3">Fan Speed</p>
              <div className="flex items-end gap-3">
                {['auto','low','medium','high','fan'].map((s, i) => {
                  const active = (s === 'fan' ? ds.mode === 'fan' : ds.fanSpeed === s);
                  return (
                    <button key={s} onClick={() => s === 'fan' ? send({ mode:'fan' }) : send({ fanSpeed:s })}
                      className="flex flex-col items-center gap-1">
                      <div className={`rounded-sm transition-colors ${active ? 'bg-al-navy' : 'bg-al-bar-off'}`}
                           style={{ width:28, height:14 + i * 6 }} />
                      <span className="text-[9px] text-al-sub capitalize">{s==='fan'?'Fan':s.charAt(0).toUpperCase()+s.slice(1)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ESP status */}
            <div className="flex justify-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium
                ${unit.isOnline
                  ? 'border-al-green/40 bg-al-green-bg text-green-700'
                  : 'border-al-border bg-al-bg text-al-sub'}`}>
                <Wifi size={14} />
                ESP8266 | {unit.isOnline ? 'Connected' : 'Offline'}
              </div>
            </div>
          </div>

          {/* ── Right: modes + extras ── */}
          <div className="space-y-5">
            {/* Modes */}
            <div>
              <p className="text-xs font-bold text-al-sub uppercase tracking-wider mb-3">Modes</p>
              <div className="grid grid-cols-4 gap-2">
                {MODES.map(({ key, emoji, label, activeColor, activeBg }) => {
                  const active = ds.mode === key;
                  return (
                    <button key={key} onClick={() => send({ mode: key })}
                      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all"
                      style={{ borderColor: active ? activeColor+'66' : '#e2e8f0', background: active ? activeBg : '#f8fafc' }}>
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[9px] font-bold text-al-sub">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Swing */}
            <div>
              <p className="text-xs font-bold text-al-sub uppercase tracking-wider mb-2">Swing</p>
              <div className="space-y-2.5">
                {['Vertical','Horizontal'].map(dir => (
                  <div key={dir} className="flex items-center justify-between">
                    <span className="text-xs text-al-sub">{dir}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-al-border rounded-full relative">
                        <div className="absolute left-0 top-0 h-full w-1/2 bg-al-navy rounded-full" />
                        <div className="absolute top-1/2 -translate-y-1/2 bg-white border-2 border-al-navy rounded-full"
                             style={{width:12,height:12,left:'calc(50% - 6px)'}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Turbo + Energy Saver */}
            <div className="space-y-3 pt-1">
              {[
                { label:'Turbo Mode',    key:'turbo',       checked:!!ds.turbo },
                { label:'Energy Saver',  key:'energySaver', checked:!!ds.energySaver },
              ].map(({ label, key, checked }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-al-sub uppercase tracking-wider">{label}</span>
                  <ToggleSwitch checked={checked} onChange={v => send({ [key]:v })} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Performance chart ── */}
        <div className="mx-6 mb-6 p-4 bg-al-bg border border-al-border rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-al-text uppercase tracking-wider">Performance &amp; Runtime</p>
            <p className="text-xs text-al-muted">Runtime: 3h Today | Historical Average</p>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} domain={[0,10]} ticks={[0,5,10]} tickFormatter={v=>`${v}h`} />
              <Tooltip
                contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontSize:11 }}
                formatter={v => [`${v}h`,'Runtime']}
              />
              <Area type="monotone" dataKey="h" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" />
              {/* Historical average dashed line */}
              <Area type="monotone" dataKey={() => 5} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
