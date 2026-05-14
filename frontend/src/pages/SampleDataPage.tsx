import { useState } from 'react';
import { Database, Sparkles, CheckCircle2, AlertCircle, Building2, Package, BarChart3, AlertTriangle, Factory, TrendingUp } from 'lucide-react';

const ENTITIES: { id: string; label: string; desc: string; icon: typeof Building2 }[] = [
  { id: 'suppliers', label: 'Suppliers', desc: 'Foundries, fabless, materials, EDA (UMC, GF, SMIC, Apple, AMD, Qualcomm, MediaTek, JSR)', icon: Building2 },
  { id: 'components', label: 'Components', desc: 'Wafer-start orders for 2nm/3nm/4nm/7nm logic, HBM3e, CoWoS-L, SoIC-X, EUV masks', icon: Package },
  { id: 'allocations', label: 'Allocations', desc: 'Customer wafer allocations (NVIDIA, Apple, AMD, Qualcomm, Google, Tesla, MediaTek)', icon: BarChart3 },
  { id: 'risk-alerts', label: 'Risk Alerts', desc: 'Geopolitical, capacity, export-control, single-source, cyber, financial risks', icon: AlertTriangle },
  { id: 'fabs', label: 'Fabs', desc: 'TSMC N2, Samsung Pyeongtaek HBM4, Intel Magdeburg, GF Malta, ASML Veldhoven', icon: Factory },
  { id: 'intelligence', label: 'Market Intelligence', desc: 'NVIDIA Rubin, Samsung 2nm yield, Intel 18A, ASML High-NA, HBM4 spec, CXMT', icon: TrendingUp }
];

type Result = { entity: string; inserted: number };

export default function SampleDataPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<Result | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const seed = async (entity: string) => {
    setBusy(entity);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/sample-data/${entity}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.error || msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const data = (await res.json()) as Result;
      setLast(data);
      setCounts(c => ({ ...c, [entity]: (c[entity] || 0) + data.inserted }));
    } catch (e: unknown) {
      setError((e as Error).message || 'Sample data load failed');
    } finally {
      setBusy(null);
      window.setTimeout(() => setLast(prev => (prev?.entity === entity ? null : prev)), 4000);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-gray-950" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sample Data</h1>
          <p className="text-gray-400 text-sm">Seed each entity with 5-10 domain-realistic semiconductor supply-chain rows.</p>
        </div>
      </div>

      {last && (
        <div className="mb-4 max-w-3xl bg-green-900/40 border border-green-700/60 text-green-300 rounded-lg p-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Inserted <span className="font-bold">{last.inserted}</span> {last.entity} rows.
        </div>
      )}
      {error && (
        <div className="mb-4 max-w-3xl bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="max-w-3xl bg-gray-900 border border-gray-800 rounded-xl p-3 mb-4 text-xs text-gray-400 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <span>
          Tip: seed <span className="text-gray-200">Components</span> first if you plan to seed{' '}
          <span className="text-gray-200">Allocations</span> (allocations FK to components).
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {ENTITIES.map(e => {
          const Icon = e.icon;
          const inserted = counts[e.id] || 0;
          return (
            <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-amber-700 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white text-sm">{e.label}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{e.desc}</div>
                  </div>
                </div>
                {inserted > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                    +{inserted}
                  </span>
                )}
              </div>
              <button
                onClick={() => seed(e.id)}
                disabled={busy === e.id}
                className="w-full flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-gray-950 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                {busy === e.id ? 'Inserting...' : `Insert sample ${e.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
