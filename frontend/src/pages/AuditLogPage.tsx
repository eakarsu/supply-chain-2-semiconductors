import { useEffect, useState, useCallback } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { api } from '../api';

interface AuditEntry {
  id: number;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number|null;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [q, setQ] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string,string> = {};
      if (q) params.q = q;
      if (entityType) params.entity_type = entityType;
      if (action) params.action = action;
      const d = await api.auditLog.list(params);
      setEntries(d);
    } catch (e: unknown) { setError((e as Error).message || 'Failed to load audit log'); }
    finally { setLoading(false); }
  }, [q, entityType, action]);

  useEffect(() => { load(); }, [load]);

  const inp = "bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  const actionColor: Record<string,string> = {
    export: 'text-blue-400',
    create: 'text-green-400',
    update: 'text-yellow-400',
    delete: 'text-red-400',
    login: 'text-violet-400'
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><ScrollText className="w-5 h-5 text-gray-950" /></div>
        <div><h1 className="text-2xl font-bold text-white">Audit Log</h1><p className="text-gray-400 text-sm">{entries.length} recent events</p></div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={q} onChange={e=>setQ(e.target.value)} className={inp} placeholder="Search details..." />
          <input value={entityType} onChange={e=>setEntityType(e.target.value)} className={inp} placeholder="Entity type (e.g., suppliers)" />
          <input value={action} onChange={e=>setAction(e.target.value)} className={inp} placeholder="Action (export, create, ...)" />
          <button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />{loading?'Loading...':'Refresh'}</button>
        </div>
      </div>
      {error && <div className="mb-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg p-3 text-sm max-w-5xl">{error}</div>}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-w-5xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Time</th>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Action</th>
              <th className="text-left px-4 py-2">Entity</th>
              <th className="text-left px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-6">No audit entries.</td></tr>}
            {entries.map(e => (
              <tr key={e.id} className="border-t border-gray-800 text-gray-300">
                <td className="px-4 py-2 text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs">{e.user_email}</td>
                <td className={`px-4 py-2 text-xs font-medium ${actionColor[e.action]||'text-white'}`}>{e.action}</td>
                <td className="px-4 py-2 text-xs">{e.entity_type}{e.entity_id?` #${e.entity_id}`:''}</td>
                <td className="px-4 py-2 text-xs text-gray-400 max-w-md truncate">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
