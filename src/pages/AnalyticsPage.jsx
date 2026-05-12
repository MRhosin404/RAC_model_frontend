import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, TrendingUp, Zap, DollarSign,
  Thermometer, BarChart2, Calendar, Award, Wind,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { unitsApi } from '../services/api';

const COST_RATE = parseFloat(localStorage.getItem('al_rate') || '0.136');
const PIE_COLORS = ['#6366f1','#3b82f6','#0d9488','#f59e0b','#ef4444','#8b5cf6'];

// ── Demo / fallback analytics data ──────────────────────────
const DAILY_MOCK = [
  {day:'Mon',kwh:8.2,cost:1.12},{day:'Tue',kwh:9.5,cost:1.29},
  {day:'Wed',kwh:7.8,cost:1.06},{day:'Thu',kwh:10.1,cost:1.37},
  {day:'Fri',kwh:11.2,cost:1.52},{day:'Sat',kwh:12.5,cost:1.70},
  {day:'Sun',kwh:9.8,cost:1.33},
];
const MONTHLY_MOCK = [
  {month:'Dec',kwh:280},{month:'Jan',kwh:310},{month:'Feb',kwh:295},
  {month:'Mar',kwh:260},{month:'Apr',kwh:330},{month:'May',kwh:348},
];
const HOURLY_MOCK = [
  {h:'00',kw:0.6},{h:'02',kw:0.4},{h:'04',kw:0.3},{h:'06',kw:0.7},
  {h:'08',kw:1.4},{h:'10',kw:2.2},{h:'12',kw:2.8},{h:'14',kw:2.6},
  {h:'16',kw:2.0},{h:'18',kw:1.7},{h:'20',kw:1.2},{h:'22',kw:0.8},
];

const StatBox = ({ icon:Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm
                  hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg mb-4
                     group-hover:scale-110 transition-transform`}>
      <Icon size={22} className="text-white"/>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
    {sub && <p className="text-xs font-bold text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [units,  setUnits]  = useState([]);
  const [period, setPeriod] = useState('week'); // week | month | year

  useEffect(() => {
    unitsApi.list()
      .then(({ data }) => setUnits(data.data || []))
      .catch(() => setUnits([]));
  }, []);

  // Aggregate stats from units
  const totalEnergyToday = units.reduce((s,u)=>s+(u.sensorData?.energyToday||0),0);
  const totalEnergyMonth = units.reduce((s,u)=>s+(u.sensorData?.energyMonth||0),0);
  const totalCostToday   = (totalEnergyToday * COST_RATE).toFixed(2);
  const totalCostMonth   = (totalEnergyMonth * COST_RATE).toFixed(2);
  const avgTemp          = units.length
    ? (units.reduce((s,u)=>s+(u.sensorData?.roomTemperature||0),0)/units.length).toFixed(1)
    : '—';
  const onlineCount      = units.filter(u=>u.isOnline).length;
  const activeCount      = units.filter(u=>u.desiredState?.power&&u.isOnline).length;

  // Per-unit pie data
  const pieData = units.map(u => ({
    name:  u.name,
    value: +(u.sensorData?.energyMonth || (Math.random()*100+30).toFixed(1)),
  }));

  // Per-unit table data
  const tableData = units.map(u => ({
    name:       u.name,
    location:   u.location || '—',
    todayKwh:   (u.sensorData?.energyToday || 0).toFixed(2),
    todayCost:  ((u.sensorData?.energyToday||0)*COST_RATE).toFixed(2),
    monthKwh:   (u.sensorData?.energyMonth || 0).toFixed(1),
    monthCost:  ((u.sensorData?.energyMonth||0)*COST_RATE).toFixed(2),
    isOnline:   u.isOnline,
    power:      u.desiredState?.power,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <button onClick={()=>navigate('/')}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <ChevronLeft size={24}/>
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-800">Analytics</h1>
                <p className="text-slate-400 font-bold text-sm">Energy consumption & cost breakdown</p>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
              {['week','month','year'].map(p => (
                <button key={p} onClick={()=>setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all
                    ${period===p?'bg-indigo-600 text-white shadow':'text-slate-400 hover:text-slate-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </header>

          {/* Top stat boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBox icon={Zap}         label="Total Energy Today"    value={`${totalEnergyToday.toFixed(1)} kWh`} sub={`$${totalCostToday} cost`}     color="bg-indigo-600"/>
            <StatBox icon={DollarSign}  label="Monthly Cost"          value={`$${totalCostMonth}`}                 sub={`${totalEnergyMonth.toFixed(0)} kWh total`} color="bg-emerald-600"/>
            <StatBox icon={Thermometer} label="Avg Home Temp"         value={`${avgTemp}°C`}                       sub={`${onlineCount}/${units.length} online`}     color="bg-cyan-500"/>
            <StatBox icon={Wind}        label="Active AC Units"        value={`${activeCount}`}                     sub={`of ${units.length} total`}     color="bg-amber-500"/>
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Daily consumption bar */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Daily Consumption</h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full">kWh / day</span>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DAILY_MOCK} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:11,fontWeight:700}}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={v=>`${v}`}/>
                    <Tooltip contentStyle={{borderRadius:16,border:'none',boxShadow:'0 4px 24px rgba(0,0,0,0.10)'}} formatter={v=>[`${v} kWh`,'Energy']}/>
                    <Bar dataKey="kwh" fill="#6366f1" radius={[8,8,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly pattern area */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Hourly Pattern</h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Today</span>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HOURLY_MOCK} margin={{top:4,right:4,bottom:0,left:-20}}>
                    <defs>
                      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:700}} tickFormatter={v=>`${v}:00`}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={v=>`${v}kW`}/>
                    <Tooltip contentStyle={{borderRadius:16,border:'none'}} formatter={v=>[`${v} kW`,'Power']}/>
                    <Area type="monotone" dataKey="kw" stroke="#6366f1" strokeWidth={3} fill="url(#hg)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Monthly trend */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Monthly Trend</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Last 6 months</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_MOCK} margin={{top:4,right:4,bottom:0,left:-20}}>
                    <defs>
                      <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:11,fontWeight:700}}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={v=>`${v}`}/>
                    <Tooltip contentStyle={{borderRadius:16,border:'none'}} formatter={v=>[`${v} kWh`,'Monthly']}/>
                    <Area type="monotone" dataKey="kwh" stroke="#3b82f6" strokeWidth={3} fill="url(#mg)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-room pie */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-800 text-base uppercase tracking-tight mb-6">By Room</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData.length ? pieData : [{name:'No data',value:1}]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {(pieData.length ? pieData : [{name:'No data'}]).map((_,i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:12,border:'none'}} formatter={v=>[`${Number(v).toFixed(1)} kWh`,'Usage']}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-3">
                {(pieData.length ? pieData.slice(0,4) : []).map((d,i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700">{Number(d.value).toFixed(0)} kWh</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-unit table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Per-Unit Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {['Unit','Location','Status','Today kWh','Today Cost','Month kWh','Month Cost'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.length ? tableData.map((row,i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-800">{row.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{row.location}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full
                          ${row.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {row.isOnline ? (row.power ? 'RUNNING' : 'STANDBY') : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-700">{row.todayKwh} kWh</td>
                      <td className="px-6 py-4 font-black text-emerald-600">${row.todayCost}</td>
                      <td className="px-6 py-4 font-black text-slate-700">{row.monthKwh} kWh</td>
                      <td className="px-6 py-4 font-black text-emerald-600">${row.monthCost}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No unit data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
