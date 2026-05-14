const kpis = [
  { label: 'Total Components Tracked', value: '24', sub: '+2 this quarter', color: 'amber' },
  { label: 'High-Risk Alerts', value: '3', sub: '1 critical, 2 high', color: 'red' },
  { label: 'Avg Lead Time', value: '18 wks', sub: '+3 wks vs Q1', color: 'orange' },
  { label: 'Capacity Utilization', value: '91%', sub: 'Near saturation', color: 'yellow' },
]

const alerts = [
  {
    severity: 'critical',
    title: 'TSMC CoWoS-S Packaging at 100% Capacity',
    detail: 'All CoWoS-S packaging slots allocated through Q3 2025. Zero buffer for new orders.',
    time: '2h ago',
    type: 'Capacity',
  },
  {
    severity: 'high',
    title: 'EUV Mask Set Lead Time Extended to 28 Weeks',
    detail: 'Shin-Etsu reporting 56% increase in EUV mask lead times due to photoresist shortage.',
    time: '6h ago',
    type: 'Single Source',
  },
  {
    severity: 'high',
    title: 'Export Control Risk: ASML Tool Restrictions',
    detail: 'Potential expansion of EUV tool export restrictions to additional regions pending review.',
    time: '1d ago',
    type: 'Export Control',
  },
]

const tiers = [
  { tier: 'Tier 1', count: 3, suppliers: ['TSMC', 'Samsung', 'ASML'], utilization: 94 },
  { tier: 'Tier 2', count: 2, suppliers: ['Lam Research', 'SK Hynix'], utilization: 82 },
  { tier: 'Tier 3', count: 1, suppliers: ['Shin-Etsu'], utilization: 71 },
]

const severityBadge: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-yellow-600 text-gray-950',
}

function UtilBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-red-500' : value >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{value}%</span>
    </div>
  )
}

export default function SupplyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Supply Chain Dashboard</h2>
        <p className="text-sm text-gray-400">Real-time visibility across semiconductor supply network</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-2">{k.label}</div>
            <div className={`text-2xl font-black mb-1 ${
              k.color === 'red' ? 'text-red-400' :
              k.color === 'orange' ? 'text-orange-400' :
              k.color === 'yellow' ? 'text-yellow-400' :
              'text-amber-400'
            }`}>{k.value}</div>
            <div className="text-xs text-gray-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Risk Alerts Feed */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Risk Alerts</h3>
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">{alerts.length} active</span>
          </div>
          <div className="divide-y divide-gray-800">
            {alerts.map((a, i) => (
              <div key={i} className={`p-4 border-l-4 ${
                a.severity === 'critical' ? 'border-red-500' :
                a.severity === 'high' ? 'border-orange-500' : 'border-yellow-500'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${severityBadge[a.severity]}`}>
                    {a.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{a.time}</span>
                </div>
                <div className="text-sm font-medium text-white mb-1">{a.title}</div>
                <div className="text-xs text-gray-400">{a.detail}</div>
                <div className="mt-2">
                  <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{a.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Tiers */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Capacity by Supplier Tier</h3>
          </div>
          <div className="p-4 space-y-5">
            {tiers.map(t => (
              <div key={t.tier}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-semibold text-amber-400">{t.tier}</span>
                    <span className="text-xs text-gray-500 ml-2">{t.count} suppliers</span>
                  </div>
                  <span className="text-xs text-gray-400">{t.utilization}% utilized</span>
                </div>
                <UtilBar value={t.utilization} />
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.suppliers.map(s => (
                    <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-2">Overall Network Health</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: '91%' }} />
                </div>
                <span className="text-sm font-bold text-amber-400">91%</span>
              </div>
              <div className="text-xs text-orange-400 mt-1">Near saturation — monitor closely</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
