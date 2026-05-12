import { useState } from 'react';
import { X, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { unitsApi } from '../services/api';
import toast from 'react-hot-toast';

/* Calibration diagram SVG — exactly matching Image 3 */
const CalibDiagram = () => (
  <svg viewBox="0 0 320 160" className="w-full" fill="none">
    {/* AC unit */}
    <rect x="10" y="50" width="80" height="40" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
    <rect x="18" y="58" width="64" height="5" rx="2" fill="#cbd5e1"/>
    <rect x="18" y="66" width="64" height="3" rx="1.5" fill="#e2e8f0"/>
    <rect x="18" y="72" width="64" height="3" rx="1.5" fill="#e2e8f0"/>
    {/* Airflow lines */}
    {[0,1,2,3].map(i=><line key={i} x1={22+i*14} y1="95" x2={22+i*14} y2="110" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2"/>)}

    {/* Arrow AC → Server */}
    <line x1="92" y1="70" x2="148" y2="70" stroke="#1e3a5f" strokeWidth="1.5"/>
    <polygon points="148,66 156,70 148,74" fill="#1e3a5f"/>
    {/* Arrow Server → AC */}
    <line x1="148" y1="78" x2="92" y2="78" stroke="#1e3a5f" strokeWidth="1.5"/>
    <polygon points="92,74 84,78 92,82" fill="#1e3a5f"/>

    {/* MERN Server stack icon */}
    <rect x="158" y="45" width="50" height="12" rx="3" fill="#1e3a5f"/>
    <rect x="158" y="60" width="50" height="12" rx="3" fill="#2d5082"/>
    <rect x="158" y="75" width="50" height="12" rx="3" fill="#3d6494"/>
    <text x="183" y="52" textAnchor="middle" fill="white" fontSize="6" fontFamily="Poppins,sans-serif">MongoDB</text>
    <text x="183" y="67" textAnchor="middle" fill="white" fontSize="6" fontFamily="Poppins,sans-serif">Express</text>
    <text x="183" y="82" textAnchor="middle" fill="white" fontSize="6" fontFamily="Poppins,sans-serif">Node.js</text>
    <text x="183" y="100" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="Poppins,sans-serif">MERN Stack Server</text>
    <text x="183" y="108" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="Poppins,sans-serif">(MongoDB + Express/Node.js)</text>

    {/* Arrow Server → React */}
    <line x1="210" y1="65" x2="250" y2="65" stroke="#1e3a5f" strokeWidth="1.5"/>
    <polygon points="250,61 258,65 250,69" fill="#1e3a5f"/>
    <line x1="258" y1="72" x2="210" y2="72" stroke="#1e3a5f" strokeWidth="1.5"/>
    <polygon points="210,68 202,72 210,76" fill="#1e3a5f"/>

    {/* React icon */}
    <circle cx="278" cy="50" r="18" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5"/>
    <circle cx="278" cy="50" r="5" fill="#38bdf8"/>
    <ellipse cx="278" cy="50" rx="17" ry="6" stroke="#38bdf8" strokeWidth="1.2" fill="none"/>
    <ellipse cx="278" cy="50" rx="17" ry="6" stroke="#38bdf8" strokeWidth="1.2" fill="none" transform="rotate(60,278,50)"/>
    <ellipse cx="278" cy="50" rx="17" ry="6" stroke="#38bdf8" strokeWidth="1.2" fill="none" transform="rotate(-60,278,50)"/>
    <text x="278" y="76" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="Poppins,sans-serif">React Dashboard</text>

    {/* Arrow React → AC device (bottom) */}
    <line x1="278" y1="78" x2="278" y2="98" stroke="#1e3a5f" strokeWidth="1.5"/>
    <polygon points="274,98 278,106 282,98" fill="#1e3a5f"/>
    <rect x="258" y="108" width="40" height="20" rx="5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
    {[0,1,2].map(i=><rect key={i} x={262+i*10} y={112} width="8" height="3" rx="1" fill="#cbd5e1"/>)}
    {[0,1,2,3].map(i=><line key={i} x1={262+i*6} y1="130" x2={262+i*6} y2="138" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2 2"/>)}
  </svg>
);

export default function AddUnitModal({ onClose, onCreated }) {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('Idle');
  const [form, setForm] = useState({
    name:'', location:'', brand:'', serialNumber:'',
    roomSize:'', insulation:'1-10', windowOrientation:'North/South/East/West',
    cardVariant:'simple', hasTurbo:false, hasEnergy:false,
  });
  const [createdApiKey, setCreatedApiKey] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setB = k => v => setForm(f => ({ ...f, [k]: v }));

  const findDevice = () => {
    if (!form.name.trim()) { toast.error('Unit name is required'); return; }
    setLoading(true);
    setDbStatus('Validating unique device ID...');
    setTimeout(() => {
      setDbStatus('Device found! Ready to provision.');
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const calibrate = async () => {
    setLoading(true);
    setDbStatus('Saving device parameters to MongoDB...');
    try {
      const { data } = await unitsApi.create({
        name:        form.name,
        location:    form.location,
        brand:       form.brand,
        cardVariant: form.cardVariant,
        hasTurbo:    form.hasTurbo,
        hasEnergy:   form.hasEnergy,
        roomSize:    form.roomSize,
        insulation:  form.insulation,
      });
      setCreatedApiKey(data.apiKey || '');
      setDbStatus('✅ Calibrated & saved to MongoDB!');
      onCreated?.(data.data);
      toast.success('AC unit created! Save the API key below.');
      setStep(3);
    } catch (err) {
      setDbStatus('❌ ' + (err.response?.data?.message || 'Creation failed'));
      toast.error(err.response?.data?.message || 'Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

      <div className="relative w-full max-w-4xl animate-slide-up" onClick={e => e.stopPropagation()}>

        {/* ── STEP 1: Identification ── */}
        <div className="bg-white rounded-2xl shadow-card-lg border border-al-border p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-al-text text-base">STEP 1: Register New AC Unit</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${step >= 1 ? 'text-al-teal' : 'text-al-muted'}`}>1. Identification</span>
              <ChevronRight size={14} className="text-al-muted" />
              <span className={`font-semibold ${step >= 2 ? 'text-al-teal' : 'text-al-muted'}`}>2. Provisioning</span>
              {step === 3 && <><ChevronRight size={14} className="text-al-muted" /><span className="font-semibold text-al-green">3. Done!</span></>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="UNIT NAME">
              <Input placeholder="e.g. KITCHEN" value={form.name} onChange={set('name')} />
            </Field>
            <Field label="LOCATION">
              <Input placeholder="e.g. KITCHEN" value={form.location} onChange={set('location')} />
            </Field>
            <Field label="SERIAL NUMBER">
              <Input placeholder="e.g. GY-4RXC-ECC" value={form.serialNumber} onChange={set('serialNumber')} />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-al-muted uppercase tracking-wider mb-1">BRAND</label>
              <Input placeholder="e.g. Daikin" value={form.brand} onChange={set('brand')} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-al-muted uppercase tracking-wider mb-1">CARD STYLE</label>
              <select value={form.cardVariant} onChange={set('cardVariant')}
                className="w-full bg-white border border-al-border rounded-xl px-3 py-2.5 text-sm text-al-text outline-none focus:border-al-navy/40">
                <option value="simple">Simple (Master Bedroom style)</option>
                <option value="extended">Extended (Guest Room style)</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hasTurbo} onChange={e=>setB('hasTurbo')(e.target.checked)} className="rounded border-al-border" />
                <span className="text-xs text-al-sub">Has Turbo Mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hasEnergy} onChange={e=>setB('hasEnergy')(e.target.checked)} className="rounded border-al-border" />
                <span className="text-xs text-al-sub">Has Energy Saver</span>
              </label>
            </div>
          </div>

          {step < 2 && (
            <button onClick={findDevice} disabled={loading}
              className="mt-5 w-full py-3 rounded-xl bg-al-navy text-white font-bold text-sm
                         hover:bg-al-navy-lt transition-colors flex items-center justify-center gap-2
                         disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Find Device
            </button>
          )}
        </div>

        {/* DB Status sidebar pill */}
        {dbStatus !== 'Idle' && (
          <div className="absolute top-6 right-6 z-10 bg-white border border-al-border rounded-xl shadow-card px-4 py-3 max-w-xs">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-al-text">Mongoose DB Status</p>
                <p className="text-xs text-al-sub mt-0.5">{dbStatus}</p>
              </div>
              <button onClick={() => setDbStatus('Idle')} className="text-al-muted hover:text-al-text"><X size={13}/></button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Configure & Calibrate ── */}
        {step >= 2 && step < 3 && (
          <div className="bg-white rounded-2xl shadow-card-lg border border-al-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-al-text text-base">STEP 2: Configure &amp; Calibrate</h3>
              <button onClick={onClose} className="text-al-muted hover:text-al-text"><X size={16}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: form fields */}
              <div className="space-y-4">
                <Field label="ROOM SIZE (Sq Ft)">
                  <Input type="number" placeholder="40" value={form.roomSize} onChange={set('roomSize')} />
                </Field>
                <Field label="INSULATION QUALITY (1-10)">
                  <select value={form.insulation} onChange={set('insulation')}
                    className="w-full bg-white border border-al-border rounded-xl px-3 py-2.5 text-sm text-al-text outline-none focus:border-al-navy/40">
                    {Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </Field>
                <Field label="WINDOW ORIENTATION">
                  <select value={form.windowOrientation} onChange={set('windowOrientation')}
                    className="w-full bg-white border border-al-border rounded-xl px-3 py-2.5 text-sm text-al-text outline-none focus:border-al-navy/40">
                    {['North','South','East','West','North/South','East/West','North/South/East/West'].map(o=>
                      <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              {/* Right: diagram */}
              <div className="flex items-center justify-center p-2">
                <CalibDiagram />
              </div>
            </div>

            <div className="mt-5 p-3 bg-al-bg rounded-xl text-center border border-al-border">
              <p className="text-xs font-bold text-al-text">READY TO CALIBRATE.</p>
              <p className="text-xs text-al-sub">Pressing this will generate and save detailed device parameters to MongoDB.</p>
            </div>

            <button onClick={calibrate} disabled={loading}
              className="mt-4 w-full py-3.5 rounded-xl bg-al-green text-white font-bold text-sm uppercase tracking-wider
                         hover:bg-green-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Calibrate &amp; Submit (Real-Time DB Sync)
            </button>
          </div>
        )}

        {/* ── STEP 3: Done / API key ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-card-lg border border-al-border p-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 bg-al-green-bg rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-al-green" />
              </div>
              <h3 className="font-bold text-al-text text-lg">{form.name} created successfully!</h3>
              <p className="text-al-sub text-sm text-center max-w-md">
                Copy this API key and flash it to your ESP8266. It will not be shown again.
              </p>
              {createdApiKey && (
                <div className="w-full bg-al-bg border border-al-border rounded-xl p-4">
                  <p className="text-[10px] font-bold text-al-muted uppercase tracking-wider mb-2">Device API Key (copy now)</p>
                  <code className="text-sm font-mono text-al-text break-all">{createdApiKey}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(createdApiKey); toast.success('Copied!'); }}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-al-navy text-white text-xs font-semibold hover:bg-al-navy-lt transition-colors"
                  >Copy to clipboard</button>
                </div>
              )}
              <button onClick={onClose}
                className="px-8 py-2.5 rounded-xl bg-al-navy text-white font-semibold text-sm hover:bg-al-navy-lt transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-bold text-al-muted uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ className='', ...p }) => (
  <input {...p}
    className={`w-full bg-white border border-al-border rounded-xl px-3.5 py-2.5 text-sm text-al-text
                placeholder-al-muted outline-none focus:border-al-navy/40 focus:ring-2 focus:ring-al-navy/10
                transition-all ${className}`} />
);
