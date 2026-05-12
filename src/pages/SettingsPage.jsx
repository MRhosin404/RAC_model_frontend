import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Save, Trash2, Edit3, Check, X,
  Zap, DollarSign, ShieldCheck, AlertTriangle,
  Loader2, Settings, Wind,
} from 'lucide-react';
import { unitsApi } from '../services/api';
import { useAuth }  from '../context/AuthContext';
import toast from 'react-hot-toast';

const Section = ({ title, children }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-8 py-6 border-b border-slate-100">
      <h2 className="font-black text-slate-800 text-base uppercase tracking-tight">{title}</h2>
    </div>
    <div className="p-8 space-y-6">{children}</div>
  </div>
);

const Field = ({ label, sub, children }) => (
  <div>
    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
    {sub && <p className="text-[10px] text-slate-400 font-medium mb-2">{sub}</p>}
    {children}
  </div>
);

const Input = ({ className='', ...p }) => (
  <input {...p}
    className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl
                px-4 py-3 text-sm font-bold outline-none
                focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all ${className}`}/>
);

export default function SettingsPage() {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  // Electricity settings
  const [rate,     setRate]     = useState(localStorage.getItem('al_rate')     || '0.136');
  const [currency, setCurrency] = useState(localStorage.getItem('al_currency') || 'USD');
  const [appName,  setAppName]  = useState(localStorage.getItem('al_appname')  || 'AuraLink Global');

  // Units list
  const [units,   setUnits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId,  setEditId]  = useState(null);
  const [editForm,setEditForm]= useState({});
  const [deleting,setDeleting]= useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    unitsApi.list()
      .then(({ data }) => setUnits(data.data || []))
      .catch(() => setUnits([]))
      .finally(() => setLoading(false));
  }, []);

  const savePrefs = () => {
    const r = parseFloat(rate);
    if (isNaN(r) || r <= 0) { toast.error('Enter a valid rate (e.g. 0.136)'); return; }
    localStorage.setItem('al_rate',     String(r));
    localStorage.setItem('al_currency', currency);
    localStorage.setItem('al_appname',  appName);
    toast.success('Preferences saved!');
  };

  const startEdit = (unit) => {
    setEditId(unit._id);
    setEditForm({ name: unit.name, location: unit.location||'', brand: unit.brand||'' });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const { data } = await unitsApi.update(id, editForm);
      setUnits(prev => prev.map(u => u._id === id ? { ...u, ...editForm } : u));
      setEditId(null);
      toast.success('Unit updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const deleteUnit = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"?\nThis also removes it from the ESP device.`)) return;
    setDeleting(id);
    try {
      await unitsApi.delete(id);
      setUnits(prev => prev.filter(u => u._id !== id));
      toast.success(`"${name}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(null); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <header className="flex items-center gap-4 mb-10">
            <button onClick={()=>navigate('/')}
              className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <ChevronLeft size={24}/>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800">Settings</h1>
              <p className="text-slate-400 font-bold text-sm">Customize your AuraLink experience</p>
            </div>
          </header>

          <div className="space-y-6">

            {/* General */}
            <Section title="General">
              <Field label="App Name" sub="Shown in the browser tab and header">
                <Input value={appName} onChange={e=>setAppName(e.target.value)} placeholder="AuraLink Global" maxLength={40}/>
              </Field>
              <Field label="Logged in as">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-700">{user?.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
                  </div>
                  <button onClick={logout}
                    className="text-xs font-black text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-widest">
                    Logout
                  </button>
                </div>
              </Field>
            </Section>

            {/* Electricity */}
            <Section title="Electricity Rates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Rate per kWh" sub="Used to calculate energy cost in Analytics and Detail view">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                    <Input value={rate} onChange={e=>setRate(e.target.value)} type="number" step="0.001" min="0" className="pl-8" placeholder="0.136"/>
                  </div>
                </Field>
                <Field label="Currency" sub="Display currency for cost calculations">
                  <select value={currency} onChange={e=>setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300 transition-all">
                    {['USD','EUR','BDT','GBP','AED','INR','SAR'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Zap size={16} className="text-indigo-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs font-bold text-indigo-700">
                  Bangladesh rate: ~BDT 8/kWh ≈ $0.073 · Global average: $0.136/kWh
                  <br/>The ESP8266 with a PZEM-004T module will send live Watt/kWh readings automatically.
                </p>
              </div>
              <button onClick={savePrefs}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                <Save size={16}/> Save Preferences
              </button>
            </Section>

            {/* AC Unit Management */}
            <Section title="Manage AC Units">
              {loading ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 size={18} className="animate-spin"/> Loading units…
                </div>
              ) : units.length === 0 ? (
                <p className="text-slate-400 font-bold text-sm">No AC units found. Add one from the dashboard.</p>
              ) : (
                <div className="space-y-3">
                  {units.map(unit => (
                    <div key={unit._id}
                      className="border border-slate-100 rounded-2xl overflow-hidden transition-all hover:border-indigo-100">

                      {/* View mode */}
                      {editId !== unit._id ? (
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                              ${unit.isOnline ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                              <Wind size={15} className={unit.isOnline ? 'text-emerald-600' : 'text-slate-400'}/>
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 text-sm truncate">{unit.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{unit.location||'No location'} · {unit.brand||'No brand'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full
                              ${unit.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              {unit.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            <button onClick={()=>startEdit(unit)}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <Edit3 size={15}/>
                            </button>
                            <button
                              onClick={()=>deleteUnit(unit._id, unit.name)}
                              disabled={deleting===unit._id}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
                              {deleting===unit._id ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Edit mode */
                        <div className="p-4 space-y-3 bg-slate-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input value={editForm.name}     onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}     placeholder="Unit name"/>
                            <Input value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} placeholder="Location"/>
                            <Input value={editForm.brand}    onChange={e=>setEditForm(f=>({...f,brand:e.target.value}))}    placeholder="Brand"/>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={()=>saveEdit(unit._id)} disabled={saving}
                              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors disabled:opacity-60">
                              {saving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Save
                            </button>
                            <button onClick={()=>setEditId(null)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors">
                              <X size={12}/> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* WebSocket info */}
            <Section title="Real-Time Connection">
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-500"/>
                  <p className="text-sm font-black text-slate-700">Native WebSocket (No Socket.io needed)</p>
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  AuraLink uses the native WebSocket API — no Socket.io library required.
                  The backend (ws library) pushes live events to your dashboard instantly:
                  <code className="ml-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-indigo-600 text-[10px]">SENSOR_UPDATE</code>,
                  <code className="ml-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-indigo-600 text-[10px]">DEVICE_ONLINE</code>,
                  <code className="ml-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-indigo-600 text-[10px]">STATE_UPDATED</code>
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  ESP8266 → POST /api/esp/sensor/:id (voltage, current, freq, kWh) → MongoDB → WebSocket → React UI
                </p>
              </div>
            </Section>

            {/* Danger zone */}
            <div className="bg-rose-50 rounded-[2.5rem] border border-rose-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={20} className="text-rose-500"/>
                <h2 className="font-black text-rose-800 text-base uppercase tracking-tight">Danger Zone</h2>
              </div>
              <p className="text-xs font-bold text-rose-600 mb-4">
                These actions are permanent. All deleted data cannot be recovered.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { if(window.confirm('Delete ALL units from MongoDB? This cannot be undone.')) { Promise.all(units.map(u=>unitsApi.delete(u._id))).then(()=>{setUnits([]);toast.success('All units deleted');}); } }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl text-xs font-black hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest">
                  <Trash2 size={13}/> Delete All AC Units
                </button>
                <button
                  onClick={() => { if(window.confirm('Clear all local storage settings?')) { localStorage.clear(); window.location.reload(); } }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl text-xs font-black hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest">
                  <X size={13}/> Clear All Settings
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
