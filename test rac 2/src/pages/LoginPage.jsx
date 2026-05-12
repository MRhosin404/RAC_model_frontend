import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wind, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import buildingSvg from '../assets/building.svg';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [form, setForm]       = useState({ name:'', email:'', password:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        if (!form.name.trim()) { toast.error('Name required'); setLoading(false); return; }
        await register(form);
        toast.success('Account created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-al-bg flex">

      {/* ── Left: branding panel ─── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden bg-[#1e3a5f]">
        {/* Building BG */}
        <img src={buildingSvg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f]/90 to-[#0d2440]" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <Wind size={18} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">AuraLink Global</span>
          </div>
        </div>

        <div className="relative z-10 p-10 space-y-6">
          <h1 className="text-5xl font-bold text-white leading-[1.1]">
            Smart Climate<br />
            <span className="text-green-400">Control.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xs">
            Connect your ESP8266 devices and manage every AC unit globally from one dashboard.
          </p>
          <div className="flex gap-8 pt-2">
            {[['5s','Sync interval'],['30s','Heartbeat'],['∞','Command queue']].map(([v,l]) => (
              <div key={l}>
                <div className="text-2xl font-bold text-green-400 font-mono">{v}</div>
                <div className="text-white/50 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-10">
          <p className="text-white/30 text-xs">MERN Stack + ESP8266 · Standard Style</p>
        </div>
      </div>

      {/* ── Right: form ─── */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-al-navy rounded-xl flex items-center justify-center">
              <Wind size={15} className="text-white" />
            </div>
            <span className="font-bold text-al-text">AuraLink Global</span>
          </div>

          <h2 className="text-2xl font-bold text-al-text mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-al-sub text-sm mb-8">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Start controlling your environment'}
          </p>

          {/* Tab */}
          <div className="flex bg-al-bg border border-al-border rounded-xl p-1 mb-6">
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize
                  ${mode === m ? 'bg-white text-al-text shadow-sm' : 'text-al-sub hover:text-al-text'}`}>
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Full name">
                <Input type="text" placeholder="Your name" value={form.name} onChange={set('name')} autoComplete="name" />
              </Field>
            )}
            <Field label="Email address">
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} className="pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-al-muted hover:text-al-sub">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-al-navy text-white font-semibold text-sm
                         hover:bg-al-navy-lt transition-colors flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-al-muted">
            Demo: <span className="font-mono text-al-sub">demo@auralink.io / password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-al-sub mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ className = '', ...p }) => (
  <input {...p}
    className={`w-full bg-white border border-al-border text-al-text placeholder-al-muted
                rounded-xl px-3.5 py-2.5 text-sm outline-none
                focus:border-al-navy/50 focus:ring-2 focus:ring-al-navy/10 transition-all ${className}`} />
);
