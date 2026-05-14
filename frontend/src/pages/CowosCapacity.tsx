import { useEffect, useState } from 'react';
import { Layers, RefreshCcw } from 'lucide-react';
import { apiFetch } from '../api';

type Capacity = { technology: string; quarter: string; monthly_capacity_units: number; reserved_pct: number; available_pct: number; line_count: number };
type Forecast = {
  customer: string;
  forecast: {
    capacity_id: number; technology: string; quarter: string;
    monthly_capacity_units: number; customer_booked_units: number;
    total_booked_units: number; unbooked_units: number;
    customer_share_pct: number; utilization_pct: number;
  }[];
  totals: { customer_units: number; total_units: number; capacity_units: number };
};
type Booking = { id: number; technology: string; capacity_quarter: string; customer: string; quantity_units: number; delivery_quarter: string; contract_status: string; contract_value_millions: number; fab_name?: string };

export default function CowosCapacity() {
  const [capacity, setCapacity] = useState<Capacity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customer, setCustomer] = useState('NVIDIA');
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([
        apiFetch('/gap-ai-cowos-tracker/capacity'),
        apiFetch('/gap-ai-cowos-tracker/bookings')
      ]);
      setCapacity(c); setBookings(b);
    } finally {
      setLoading(false);
    }
  }
  async function loadForecast(name: string) {
    try {
      const f = await apiFetch(`/gap-ai-cowos-tracker/forecast?customer=${encodeURIComponent(name)}`);
      setForecast(f);
    } catch (e) { /* ignore */ }
  }
  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (customer) loadForecast(customer); }, [customer]);

  const technologies = Array.from(new Set(capacity.map(c => c.technology))).sort();
  const quarters = Array.from(new Set(capacity.map(c => c.quarter))).sort();

  const cellFor = (tech: string, q: string) =>
    capacity.find(c => c.technology === tech && c.quarter === q);

  const customers = Array.from(new Set(bookings.map(b => b.customer))).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Layers className="w-6 h-6 text-amber-400" />CoWoS Packaging Capacity</h1>
          <p className="text-gray-400 text-sm mt-1">Quarterly capacity by technology with NVIDIA-vs-rest customer breakdown.</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Capacity matrix (monthly wafer-equivalent units)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Technology</th>
                {quarters.map(q => <th key={q} className="py-2 pr-4">{q}</th>)}
              </tr>
            </thead>
            <tbody>
              {technologies.map(tech => (
                <tr key={tech} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 font-medium text-amber-300">{tech}</td>
                  {quarters.map(q => {
                    const c = cellFor(tech, q);
                    if (!c) return <td key={q} className="py-2 pr-4 text-gray-600">—</td>;
                    const util = Number(c.reserved_pct);
                    return (
                      <td key={q} className="py-2 pr-4">
                        <div className="text-white">{Number(c.monthly_capacity_units).toLocaleString()}</div>
                        <div className={`text-xs ${util >= 95 ? 'text-red-400' : util >= 85 ? 'text-orange-400' : 'text-green-400'}`}>{util.toFixed(0)}% reserved</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-white">Customer forecast</h2>
          <select value={customer} onChange={e => setCustomer(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {customers.length === 0 && <option value="NVIDIA">NVIDIA</option>}
            {customers.map(c => <option key={c}>{c}</option>)}
          </select>
          {forecast && (
            <span className="text-xs text-gray-400 ml-auto">
              {customer}: {forecast.totals.customer_units.toLocaleString()} units across {forecast.forecast.length} cells
              ({(100 * forecast.totals.customer_units / Math.max(forecast.totals.capacity_units, 1)).toFixed(1)}% of total capacity)
            </span>
          )}
        </div>
        {forecast && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-4">Quarter</th><th className="py-2 pr-4">Tech</th>
                  <th className="py-2 pr-4 text-right">Capacity</th>
                  <th className="py-2 pr-4 text-right">Booked</th>
                  <th className="py-2 pr-4 text-right">{customer}</th>
                  <th className="py-2 pr-4 text-right">{customer} share</th>
                  <th className="py-2 pr-4 text-right">Free</th>
                </tr>
              </thead>
              <tbody>
                {forecast.forecast.map(row => (
                  <tr key={row.capacity_id} className="border-b border-gray-800/60">
                    <td className="py-2 pr-4 text-gray-300">{row.quarter}</td>
                    <td className="py-2 pr-4 text-amber-300">{row.technology}</td>
                    <td className="py-2 pr-4 text-right text-white">{row.monthly_capacity_units.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-gray-300">{row.total_booked_units.toLocaleString()} ({row.utilization_pct}%)</td>
                    <td className="py-2 pr-4 text-right text-amber-200">{row.customer_booked_units.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-amber-300">{row.customer_share_pct}%</td>
                    <td className={`py-2 pr-4 text-right ${row.unbooked_units <= 0 ? 'text-red-400' : 'text-green-400'}`}>{row.unbooked_units.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">All bookings ({bookings.length})</h2>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Delivery Q</th><th className="py-2 pr-4">Technology</th>
                <th className="py-2 pr-4">Customer</th><th className="py-2 pr-4 text-right">Units</th>
                <th className="py-2 pr-4 text-right">$M</th><th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-gray-300">{b.delivery_quarter}</td>
                  <td className="py-2 pr-4 text-amber-300">{b.technology}</td>
                  <td className="py-2 pr-4 text-white">{b.customer}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{Number(b.quantity_units).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${Number(b.contract_value_millions).toLocaleString()}</td>
                  <td className={`py-2 pr-4 ${b.contract_status === 'locked' ? 'text-green-400' : 'text-yellow-400'}`}>{b.contract_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
