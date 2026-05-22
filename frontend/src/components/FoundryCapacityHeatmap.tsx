import { useEffect, useState } from 'react';

type Cell = { foundry: string; node: string; utilization_pct: number; offered: boolean };
type Resp = { title: string; foundries: string[]; nodes: string[]; cells: Cell[]; legend: Record<string, string> };

function colorFor(util: number, offered: boolean): string {
  if (!offered) return '#1f2937';
  if (util >= 90) return '#dc2626';
  if (util >= 75) return '#f59e0b';
  if (util >= 50) return '#10b981';
  return '#3b82f6';
}

export default function FoundryCapacityHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/foundry-heatmap', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="p-4 bg-red-900/40 text-red-200 rounded">Error: {err}</div>;
  if (!data) return <div className="p-4 text-gray-400">Loading foundry heatmap...</div>;

  const cellOf = (f: string, n: string) => data.cells.find(c => c.foundry === f && c.node === n)!;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-3">{data.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-gray-400 font-medium pr-3 py-2">Foundry</th>
              {data.nodes.map(n => (
                <th key={n} className="text-center text-gray-400 font-medium px-2 py-2">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.foundries.map(f => (
              <tr key={f} className="border-t border-gray-800">
                <td className="text-white font-medium pr-3 py-2">{f}</td>
                {data.nodes.map(n => {
                  const c = cellOf(f, n);
                  return (
                    <td key={n} className="px-1 py-1">
                      <div
                        className="rounded text-center text-xs font-bold py-2"
                        style={{ background: colorFor(c.utilization_pct, c.offered), color: c.offered ? '#fff' : '#6b7280' }}
                        title={`${f} ${n}: ${c.offered ? c.utilization_pct + '%' : 'not offered'}`}
                      >
                        {c.offered ? `${c.utilization_pct}%` : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-300">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#dc2626' }} />Critical &gt;90%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} />Tight 75-90%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#10b981' }} />Healthy 50-75%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#3b82f6' }} />Under &lt;50%</span>
      </div>
    </div>
  );
}
