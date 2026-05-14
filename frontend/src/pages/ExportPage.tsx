import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { api } from '../api';

const ENTITIES = [
  { id: 'suppliers', label: 'Suppliers', desc: 'All semiconductor suppliers' },
  { id: 'components', label: 'Components', desc: 'Components with supplier names' },
  { id: 'allocations', label: 'Allocations', desc: 'Capacity allocations to customers' },
  { id: 'risk-alerts', label: 'Risk Alerts', desc: 'Open and resolved risk alerts' },
  { id: 'fabs', label: 'Fabs', desc: 'Fabrication facilities' },
  { id: 'intelligence', label: 'Market Intelligence', desc: 'Intelligence reports' },
  { id: 'audit-log', label: 'Audit Log', desc: 'Recent audit log (last 1000)' }
];

export default function ExportPage() {
  const [busy, setBusy] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [done, setDone] = useState<string|null>(null);

  const exportEntity = async (entity: string) => {
    setBusy(entity); setError(null); setDone(null);
    try { await api.exportCsv(entity); setDone(entity); }
    catch (e: unknown) { setError((e as Error).message || 'Export failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><Download className="w-5 h-5 text-gray-950" /></div>
        <div><h1 className="text-2xl font-bold text-white">CSV Export</h1><p className="text-gray-400 text-sm">Download supply-chain data as CSV files</p></div>
      </div>
      {error && <div className="mb-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg p-3 text-sm max-w-2xl">{error}</div>}
      {done && <div className="mb-4 bg-green-900/40 border border-green-700/60 text-green-300 rounded-lg p-3 text-sm max-w-2xl">Downloaded {done}.csv</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {ENTITIES.map(e => (
          <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-amber-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-amber-400" /></div>
              <div>
                <div className="font-medium text-white text-sm">{e.label}</div>
                <div className="text-xs text-gray-500">{e.desc}</div>
              </div>
            </div>
            <button onClick={() => exportEntity(e.id)} disabled={busy === e.id} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-gray-950 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />{busy === e.id ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
