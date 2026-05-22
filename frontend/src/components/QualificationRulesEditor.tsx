import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

type Rule = {
  id: number;
  name: string;
  node_nm: number;
  region: string;
  requires_iso_9001: boolean;
  requires_iatf_16949: boolean;
  min_yield_pct: number;
  max_lead_time_days: number;
  active: boolean;
};

const blank: Omit<Rule, 'id'> = {
  name: '', node_nm: 7, region: 'Global',
  requires_iso_9001: true, requires_iatf_16949: false,
  min_yield_pct: 90, max_lead_time_days: 90, active: true
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const h: Record<string,string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function QualificationRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ ...blank });
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch('/api/custom-views/qual-rules', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => setRules(d.rules || []))
      .catch(e => setErr(e.message));
  };

  useEffect(load, []);

  const create = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/custom-views/qual-rules', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setForm({ ...blank });
      load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const update = async (rule: Rule) => {
    setBusy(true);
    try {
      await fetch(`/api/custom-views/qual-rules/${rule.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(rule) });
      load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try {
      await fetch(`/api/custom-views/qual-rules/${id}`, { method: 'DELETE', headers: authHeaders() });
      load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Supplier Qualification Rules</h3>
      {err && <div className="mb-3 p-2 bg-red-900/40 text-red-200 text-sm rounded">{err}</div>}

      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" placeholder="Rule name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" placeholder="Node nm" value={form.node_nm} onChange={e => setForm({ ...form, node_nm: Number(e.target.value) })} />
          <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" placeholder="Region" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
          <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" placeholder="Min yield %" value={form.min_yield_pct} onChange={e => setForm({ ...form, min_yield_pct: Number(e.target.value) })} />
          <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white" placeholder="Max lead days" value={form.max_lead_time_days} onChange={e => setForm({ ...form, max_lead_time_days: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-gray-300 text-xs"><input type="checkbox" checked={form.requires_iso_9001} onChange={e => setForm({ ...form, requires_iso_9001: e.target.checked })} />ISO 9001</label>
          <label className="flex items-center gap-2 text-gray-300 text-xs"><input type="checkbox" checked={form.requires_iatf_16949} onChange={e => setForm({ ...form, requires_iatf_16949: e.target.checked })} />IATF 16949</label>
          <button onClick={create} disabled={busy} className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded px-3 py-1.5 disabled:opacity-50"><Plus className="w-4 h-4" />Add</button>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.id} className="bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center text-sm">
              <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white col-span-2" value={r.name} onChange={e => setRules(rules.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} />
              <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" value={r.node_nm} onChange={e => setRules(rules.map(x => x.id === r.id ? { ...x, node_nm: Number(e.target.value) } : x))} />
              <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" value={r.region} onChange={e => setRules(rules.map(x => x.id === r.id ? { ...x, region: e.target.value } : x))} />
              <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" value={r.min_yield_pct} onChange={e => setRules(rules.map(x => x.id === r.id ? { ...x, min_yield_pct: Number(e.target.value) } : x))} />
              <div className="flex gap-1 justify-end">
                <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" checked={r.active} onChange={e => setRules(rules.map(x => x.id === r.id ? { ...x, active: e.target.checked } : x))} />Active</label>
                <button onClick={() => update(r)} disabled={busy} className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white" title="Save"><Save className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(r.id)} disabled={busy} className="p-1.5 bg-red-600 hover:bg-red-500 rounded text-white" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && <p className="text-gray-500 text-sm">No qualification rules yet.</p>}
      </div>
    </div>
  );
}
