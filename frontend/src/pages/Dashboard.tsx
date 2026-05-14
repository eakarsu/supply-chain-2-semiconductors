import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  Package,
  BarChart3,
  AlertTriangle,
  Building2,
  Sparkles,
  Database,
  Activity,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

type Kpis = {
  foundries_tracked: number;
  components: number;
  allocations_active: number;
  fabs: number;
  risk_alerts_open: number;
};

type ActivityRow = {
  id: number;
  user_email: string | null;
  action: string | null;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  created_at: string;
};

type Stats = { kpis: Kpis; recent_activity: ActivityRow[] };

const formatTime = (ts: string) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/dashboard/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Stats) => setStats(d))
      .catch(e => setError((e as Error).message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { label: 'Foundries Tracked', value: stats?.kpis.foundries_tracked ?? 0, icon: Factory, color: 'amber' },
    { label: 'Components', value: stats?.kpis.components ?? 0, icon: Package, color: 'sky' },
    { label: 'Allocations Active', value: stats?.kpis.allocations_active ?? 0, icon: BarChart3, color: 'emerald' },
    { label: 'Fabs', value: stats?.kpis.fabs ?? 0, icon: Building2, color: 'violet' },
    { label: 'Risk Alerts Open', value: stats?.kpis.risk_alerts_open ?? 0, icon: AlertTriangle, color: 'rose' }
  ];

  const colorMap: Record<string, string> = {
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-700/40 text-amber-300',
    sky: 'from-sky-500/20 to-sky-500/5 border-sky-700/40 text-sky-300',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-700/40 text-emerald-300',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-700/40 text-violet-300',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-700/40 text-rose-300'
  };

  const quickActions = [
    { to: '/ai-center', label: 'AI Center', desc: '9 semiconductor AI tools', icon: Sparkles, accent: 'violet' },
    { to: '/suppliers', label: 'Suppliers', desc: 'Foundries, fabless, materials', icon: Building2, accent: 'amber' },
    { to: '/allocations', label: 'Allocations', desc: 'Wafer allocations to customers', icon: BarChart3, accent: 'emerald' },
    { to: '/sample-data', label: 'Sample Data', desc: 'Seed entities with realistic rows', icon: Database, accent: 'sky' }
  ];

  const accentMap: Record<string, string> = {
    violet: 'hover:border-violet-600 text-violet-400',
    amber: 'hover:border-amber-600 text-amber-400',
    emerald: 'hover:border-emerald-600 text-emerald-400',
    sky: 'hover:border-sky-600 text-sky-400'
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-gray-950" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Live snapshot of your semiconductor supply chain.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {kpiCards.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`bg-gradient-to-br ${colorMap[c.color]} border rounded-xl p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-wider opacity-70">live</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {loading ? '—' : c.value.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <span className="text-xs text-gray-500 ml-auto">audit_log</span>
          </div>
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {!loading && stats && stats.recent_activity.length === 0 && (
            <div className="text-sm text-gray-500">No audit-log entries yet.</div>
          )}
          {!loading && stats && stats.recent_activity.length > 0 && (
            <div className="divide-y divide-gray-800">
              {stats.recent_activity.map(row => (
                <div key={row.id} className="py-2.5 flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{row.action || 'event'}</span>
                      {row.entity_type && (
                        <span className="text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                          {row.entity_type}
                          {row.entity_id ? ` #${row.entity_id}` : ''}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{row.user_email || 'system'}</span>
                    </div>
                    {row.details && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">{row.details}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTime(row.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-800">
            <Link
              to="/audit-log"
              className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              View full audit log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {quickActions.map(qa => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.to}
                  to={qa.to}
                  className={`flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-lg p-3 transition-colors ${accentMap[qa.accent]}`}
                >
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{qa.label}</div>
                    <div className="text-xs text-gray-500 truncate">{qa.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
