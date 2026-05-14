import { useState } from 'react';
import { Search as SearchIcon, Building2, Package, Factory, AlertTriangle, Globe } from 'lucide-react';
import { api } from '../api';

interface SearchResult {
  suppliers: { id:number; name:string; country:string; tier:number; status:string; capacity_utilization:number; export_controlled:boolean }[];
  components: { id:number; name:string; type:string; process_node_nm:number; criticality:string; status:string; supplier_name:string }[];
  fabs: { id:number; name:string; operator:string; country:string; utilization_pct:number; status:string }[];
  risk_alerts: { id:number; title:string; severity:string; risk_type:string; status:string; component_name:string; supplier_name:string }[];
  intelligence: { id:number; title:string; topic:string; impact_level:string; published_date:string; analyst:string }[];
  total: number;
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [criticality, setCriticality] = useState('');
  const [types, setTypes] = useState<string[]>(['suppliers','components','fabs','risk_alerts','intelligence']);
  const [results, setResults] = useState<SearchResult|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const toggle = (t: string) => setTypes(p => p.includes(t) ? p.filter(x=>x!==t) : [...p, t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const params: Record<string,string> = {};
      if (q) params.q = q;
      if (country) params.country = country;
      if (tier) params.tier = tier;
      if (status) params.status = status;
      if (severity) params.severity = severity;
      if (criticality) params.criticality = criticality;
      if (types.length) params.types = types.join(',');
      const d = await api.search(params);
      setResults(d);
    } catch (err: unknown) { setError((err as Error).message || 'Search failed'); }
    finally { setLoading(false); }
  };

  const inp = "w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><SearchIcon className="w-5 h-5 text-gray-950" /></div>
        <div><h1 className="text-2xl font-bold text-white">Advanced Search</h1><p className="text-gray-400 text-sm">Search & filter across the entire supply chain</p></div>
      </div>
      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 max-w-4xl space-y-3">
        <div><label className="block text-sm text-gray-300 mb-1">Search query</label><input value={q} onChange={e=>setQ(e.target.value)} className={inp} placeholder="name, capability, title, summary..." /></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="block text-xs text-gray-400 mb-1">Country</label><input value={country} onChange={e=>setCountry(e.target.value)} className={inp} placeholder="Taiwan" /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Tier</label><select value={tier} onChange={e=>setTier(e.target.value)} className={inp}><option value="">Any</option><option value="1">Tier 1</option><option value="2">Tier 2</option><option value="3">Tier 3</option></select></div>
          <div><label className="block text-xs text-gray-400 mb-1">Status</label><input value={status} onChange={e=>setStatus(e.target.value)} className={inp} placeholder="active / open / operational" /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Severity</label><select value={severity} onChange={e=>setSeverity(e.target.value)} className={inp}><option value="">Any</option>{['critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs text-gray-400 mb-1">Criticality</label><select value={criticality} onChange={e=>setCriticality(e.target.value)} className={inp}><option value="">Any</option>{['critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">Include entity types</label>
          <div className="flex flex-wrap gap-2">
            {['suppliers','components','fabs','risk_alerts','intelligence'].map(t => (
              <button type="button" key={t} onClick={()=>toggle(t)} className={`px-3 py-1 rounded-lg text-xs font-medium ${types.includes(t)?'bg-amber-500 text-gray-950':'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-6 py-2 rounded-lg text-sm disabled:opacity-50">{loading ? 'Searching...' : 'Search'}</button>
        {error && <div className="bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
      </form>

      {results && (
        <div className="space-y-6 max-w-4xl">
          <div className="text-sm text-gray-400">{results.total} total results</div>
          {results.suppliers.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-400" />Suppliers ({results.suppliers.length})</h3>
              <div className="space-y-1">
                {results.suppliers.map(s => (
                  <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div><div className="text-white text-sm font-medium">{s.name}</div><div className="text-xs text-gray-500">{s.country} • Tier {s.tier} • {s.status}</div></div>
                    {s.export_controlled && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">EAR</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.components.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-amber-400" />Components ({results.components.length})</h3>
              <div className="space-y-1">{results.components.map(c => (<div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3"><div className="text-white text-sm font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.type} • {c.process_node_nm}nm • {c.criticality} • {c.supplier_name}</div></div>))}</div>
            </div>
          )}
          {results.fabs.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Factory className="w-4 h-4 text-amber-400" />Fabs ({results.fabs.length})</h3>
              <div className="space-y-1">{results.fabs.map(f => (<div key={f.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3"><div className="text-white text-sm font-medium">{f.name}</div><div className="text-xs text-gray-500">{f.operator} • {f.country} • {Number(f.utilization_pct).toFixed(0)}% util • {f.status}</div></div>))}</div>
            </div>
          )}
          {results.risk_alerts.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Risk Alerts ({results.risk_alerts.length})</h3>
              <div className="space-y-1">{results.risk_alerts.map(r => (<div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3"><div className="text-white text-sm font-medium">{r.title}</div><div className="text-xs text-gray-500">{r.severity} • {r.risk_type} • {r.status}</div></div>))}</div>
            </div>
          )}
          {results.intelligence.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" />Intelligence ({results.intelligence.length})</h3>
              <div className="space-y-1">{results.intelligence.map(i => (<div key={i.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3"><div className="text-white text-sm font-medium">{i.title}</div><div className="text-xs text-gray-500">{i.topic} • {i.impact_level} • {i.analyst}</div></div>))}</div>
            </div>
          )}
          {results.total === 0 && <div className="text-gray-500 text-sm">No results.</div>}
        </div>
      )}
    </div>
  );
}
