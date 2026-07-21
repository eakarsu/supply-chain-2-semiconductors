import { Outlet, useNavigate } from 'react-router-dom';
import { Activity, Cpu, LogOut, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-400 p-2"><Cpu className="h-5 w-5 text-slate-950" /></span><div><div className="font-semibold">SemiChain Control Tower</div><div className="text-xs text-slate-400">Receive → inspect → approve → allocate → replan</div></div></div>
        <div className="flex items-center gap-5 text-sm"><span className="flex items-center gap-2 text-emerald-400"><ShieldCheck className="h-4 w-4" />Deterministic policy</span><span className="flex items-center gap-2 text-slate-300"><Activity className="h-4 w-4" />{user.email} · {user.role}</span><button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white"><LogOut className="h-4 w-4" />Sign out</button></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl p-6"><Outlet /></main>
  </div>;
}
