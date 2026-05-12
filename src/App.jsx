import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DetailPage    from './pages/DetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage  from './pages/SettingsPage';

const Spinner = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
      <span className="text-slate-400 text-sm font-bold">Loading AuraLink…</span>
    </div>
  </div>
);

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};
const Public = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login"         element={<Public><LoginPage /></Public>} />
      <Route path="/"              element={<Private><DashboardPage /></Private>} />
      <Route path="/detail/:unitId"element={<Private><DetailPage /></Private>} />
      <Route path="/analytics"     element={<Private><AnalyticsPage /></Private>} />
      <Route path="/settings"      element={<Private><SettingsPage /></Private>} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  );
}
