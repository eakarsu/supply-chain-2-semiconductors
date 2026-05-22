import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Cpu, Building2, Package, BarChart3, AlertTriangle, Factory, TrendingUp, Sparkles, LogOut, Search, Download, ScrollText, Database, LayoutDashboard, ShieldCheck, Network, Layers, MemoryStick, Microscope, Cloud, FileText, Activity, Globe, Workflow, Truck, Radar, CalendarClock, Wrench, GitBranch, FlaskConical, Map, Bot } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/suppliers', icon: Building2, label: 'Suppliers' },
  { to: '/components', icon: Package, label: 'Components' },
  { to: '/allocations', icon: BarChart3, label: 'Allocations' },
  { to: '/risk-alerts', icon: AlertTriangle, label: 'Risk Alerts' },
  { to: '/fabs', icon: Factory, label: 'Fabs' },
  { to: '/intelligence', icon: TrendingUp, label: 'Market Intel' },
  { to: '/supplier-graph', icon: Network, label: 'Supplier Graph' },
  { to: '/cowos-capacity', icon: Layers, label: 'CoWoS Capacity' },
  { to: '/hbm-bookings', icon: MemoryStick, label: 'HBM Bookings' },
  { to: '/eccn-classifier', icon: ShieldCheck, label: 'ECCN Classifier' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/export', icon: Download, label: 'Export' },
  { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
  { to: '/sample-data', icon: Database, label: 'Sample Data' },
  { to: '/custom-views', icon: Microscope, label: 'Chip Supply Views' },
  { to: '/osat-slot-reservation', icon: CalendarClock, label: 'OSAT Slots' },
];

const gapNavItems = [
  { to: '/gap/cowos-tracker', icon: Layers, label: 'CoWoS Tracker' },
  { to: '/gap/hbm-booking-monitor', icon: MemoryStick, label: 'HBM Booking Monitor' },
  { to: '/gap/ear-eccn-classifier', icon: ShieldCheck, label: 'EAR/ECCN Classifier' },
  { to: '/gap/tier-n-discovery', icon: Network, label: 'Tier-N Discovery' },
  { to: '/gap/wafer-yield-ml', icon: FlaskConical, label: 'Wafer Yield ML' },
  { to: '/gap/edi-sap-connector', icon: Workflow, label: 'EDI/SAP Connector' },
  { to: '/gap/realtime-allocation', icon: Activity, label: 'Realtime Allocation' },
  { to: '/gap/hts-eccn-lookup', icon: FileText, label: 'HTS/ECCN Lookup' },
  { to: '/gap/factory-weather-feed', icon: Cloud, label: 'Factory Weather' },
  { to: '/gap/po-generation', icon: Truck, label: 'PO Generation' },
  { to: '/gap/multiparty-dataroom', icon: Globe, label: 'Multiparty Dataroom' },
];

const cfNavItems = [
  { to: '/cf/tier-n-graph', icon: GitBranch, label: 'Tier-N Graph (CF)' },
  { to: '/cf/cowos-calendar', icon: CalendarClock, label: 'CoWoS Calendar' },
  { to: '/cf/eccn-live-update', icon: Radar, label: 'ECCN Live Update' },
  { to: '/cf/disaster-risk-overlay', icon: Map, label: 'Disaster Risk Overlay' },
  { to: '/cf/auto-reshuffle-agent', icon: Bot, label: 'Auto-Reshuffle Agent' },
];

// Silence unused-icon warnings if some icons are conditionally referenced
void Wrench;

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900 flex flex-col border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center"><Cpu className="w-5 h-5 text-gray-950" /></div>
            <div><div className="font-bold text-white">SemiChain</div><div className="text-xs text-amber-400">Supply Intelligence</div></div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-800">
            <NavLink to="/ai-center" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'text-violet-400 hover:text-white hover:bg-gray-800'}`}>
              <Sparkles className="w-4 h-4" />AI Center
            </NavLink>
          </div>
          <details className="pt-4 mt-4 border-t border-gray-800 group">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-gray-500 hover:text-gray-300 px-3 py-2 select-none">Gap Features</summary>
            <div className="mt-1 space-y-1">
              {gapNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </NavLink>
              ))}
            </div>
          </details>
          <details className="pt-2 mt-2 border-t border-gray-800 group">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-gray-500 hover:text-gray-300 px-3 py-2 select-none">Custom Features</summary>
            <div className="mt-1 space-y-1">
              {cfNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </NavLink>
              ))}
            </div>
          </details>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">{user.name?.[0]||'A'}</div>
            <div><div className="text-sm font-medium text-white">{user.name||'Admin'}</div><div className="text-xs text-gray-400">{user.role||'admin'}</div></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"><LogOut className="w-4 h-4" />Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950"><Outlet /></main>
    </div>
  );
}
