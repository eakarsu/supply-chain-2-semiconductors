import { useEffect, useState } from 'react';

type SeriesPoint = { month: string; demand_kwafers: number; supply_kwafers: number };
type Series = { node: string; color: string; data: SeriesPoint[] };
type Resp = { title: string; unit: string; months: string[]; series: Series[]; totals: { month: string; total_demand: number; total_supply: number }[] };

export default function WaferDemandChart() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/wafer-demand', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="p-4 bg-red-900/40 text-red-200 rounded">Error: {err}</div>;
  if (!data) return <div className="p-4 text-gray-400">Loading wafer demand...</div>;

  const maxVal = Math.max(...data.totals.map(t => Math.max(t.total_demand, t.total_supply)));
  const W = 720, H = 280, P = 40;
  const xStep = (W - 2 * P) / (data.months.length - 1);
  const y = (v: number) => H - P - ((H - 2 * P) * v) / maxVal;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">{data.title}</h3>
        <span className="text-xs text-gray-400">{data.unit}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="bg-gray-950 rounded">
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <g key={i}>
            <line x1={P} x2={W - P} y1={y(maxVal * f)} y2={y(maxVal * f)} stroke="#374151" strokeDasharray="2 4" />
            <text x={P - 6} y={y(maxVal * f) + 4} fontSize="9" fill="#9ca3af" textAnchor="end">{Math.round(maxVal * f)}</text>
          </g>
        ))}
        {data.series.map(s => {
          const path = s.data.map((d, i) => `${i === 0 ? 'M' : 'L'}${P + i * xStep},${y(d.demand_kwafers)}`).join(' ');
          return <path key={s.node} d={path} stroke={s.color} strokeWidth="2" fill="none" />;
        })}
        {data.series.map(s => s.data.map((d, i) => (
          <circle key={`${s.node}-${i}`} cx={P + i * xStep} cy={y(d.demand_kwafers)} r="3" fill={s.color} />
        )))}
        {data.months.map((m, i) => (
          <text key={m} x={P + i * xStep} y={H - P + 14} fontSize="9" fill="#9ca3af" textAnchor="middle">{m}</text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 mt-3">
        {data.series.map(s => (
          <div key={s.node} className="flex items-center gap-2 text-xs text-gray-300">
            <span className="w-3 h-3 rounded" style={{ background: s.color }} />
            <span>{s.node}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
