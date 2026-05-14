import { useEffect, useState } from 'react';
import { MemoryStick, Lock, RefreshCcw } from 'lucide-react';
import { apiFetch } from '../api';

type Cell = { hbm_supplier: string; generation: string; delivery_quarter: string; booked_gb: number; supply_gb: number; bookings_count: number };
type Matrix = { quarters: string[]; suppliers: string[]; generations: string[]; cells: Cell[] };
type Booking = { id: number; customer: string; hbm_supplier: string; generation: string; quantity_GB: number; delivery_quarter: string; contract_value_millions: number; locked: boolean };

function fmtGB(gb: number) {
  if (gb >= 1_000_000_000) return (gb / 1_000_000_000).toFixed(2) + ' PB';
  if (gb >= 1_000_000) return (gb / 1_000_000).toFixed(2) + ' TB';
  if (gb >= 1_000) return (gb / 1_000).toFixed(0) + ' MB-stack';
  return gb + ' GB';
}

export default function HbmBookings() {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState({ supplier: '', generation: '', quarter: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [m, b] = await Promise.all([
        apiFetch('/gap-ai-hbm-booking-monitor/matrix'),
        apiFetch('/gap-ai-hbm-booking-monitor/bookings')
      ]);
      setMatrix(m); setBookings(b);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  async function lockBooking(id: number) {
    try {
      await apiFetch('/gap-ai-hbm-booking-monitor/lock', { method: 'POST', body: JSON.stringify({ id }) });
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const cellFor = (sup: string, gen: string, q: string) =>
    matrix?.cells.find(c => c.hbm_supplier === sup && c.generation === gen && c.delivery_quarter === q);

  const filtered = bookings.filter(b =>
    (!filter.supplier || b.hbm_supplier === filter.supplier) &&
    (!filter.generation || b.generation === filter.generation) &&
    (!filter.quarter || b.delivery_quarter === filter.quarter)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><MemoryStick className="w-6 h-6 text-amber-400" />HBM Booking Monitor</h1>
          <p className="text-gray-400 text-sm mt-1">Supplier × Generation × Quarter matrix of HBM allocations. SK Hynix dominates HBM3e; Samsung supplies AMD; Micron in qual at NVIDIA.</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {matrix && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Booked GB matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-4">Supplier · Gen</th>
                  {matrix.quarters.map(q => <th key={q} className="py-2 pr-4">{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.suppliers.flatMap(sup =>
                  matrix.generations.map(gen => {
                    const hasAny = matrix.quarters.some(q => cellFor(sup, gen, q));
                    if (!hasAny) return null;
                    return (
                      <tr key={`${sup}-${gen}`} className="border-b border-gray-800/60">
                        <td className="py-2 pr-4"><span className="text-white">{sup}</span> <span className="text-amber-300 ml-1">{gen}</span></td>
                        {matrix.quarters.map(q => {
                          const c = cellFor(sup, gen, q);
                          if (!c) return <td key={q} className="py-2 pr-4 text-gray-700">—</td>;
                          const util = c.supply_gb > 0 ? (100 * c.booked_gb / c.supply_gb) : 0;
                          return (
                            <td key={q} className="py-2 pr-4">
                              <div className="text-white">{fmtGB(c.booked_gb)}</div>
                              <div className={`text-xs ${util >= 95 ? 'text-red-400' : util >= 85 ? 'text-orange-400' : util >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {c.supply_gb > 0 ? `${util.toFixed(0)}% of ${fmtGB(c.supply_gb)}` : 'no supply data'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Bookings</h2>
          <select value={filter.supplier} onChange={e => setFilter({ ...filter, supplier: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            <option value="">All suppliers</option>
            {matrix?.suppliers.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filter.generation} onChange={e => setFilter({ ...filter, generation: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            <option value="">All gens</option>
            {matrix?.generations.map(g => <option key={g}>{g}</option>)}
          </select>
          <select value={filter.quarter} onChange={e => setFilter({ ...filter, quarter: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            <option value="">All quarters</option>
            {matrix?.quarters.map(q => <option key={q}>{q}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {bookings.length}</span>
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Supplier</th>
                <th className="py-2 pr-4">Gen</th><th className="py-2 pr-4">Quarter</th>
                <th className="py-2 pr-4 text-right">GB</th><th className="py-2 pr-4 text-right">$M</th>
                <th className="py-2 pr-4">Status</th><th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white">{b.customer}</td>
                  <td className="py-2 pr-4 text-gray-300">{b.hbm_supplier}</td>
                  <td className="py-2 pr-4 text-amber-300">{b.generation}</td>
                  <td className="py-2 pr-4 text-gray-300">{b.delivery_quarter}</td>
                  <td className="py-2 pr-4 text-right text-gray-200">{fmtGB(Number(b.quantity_GB))}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${Number(b.contract_value_millions).toLocaleString()}</td>
                  <td className={`py-2 pr-4 ${b.locked ? 'text-green-400' : 'text-yellow-400'}`}>{b.locked ? 'locked' : 'provisional'}</td>
                  <td className="py-2 pr-2">
                    {!b.locked && (
                      <button onClick={() => lockBooking(b.id)} className="text-xs bg-amber-500 hover:bg-amber-400 text-gray-950 px-2 py-1 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />Lock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
