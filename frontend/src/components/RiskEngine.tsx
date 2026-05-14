import { useState } from 'react'

const alerts = [
  {
    severity: 'critical',
    riskType: 'Capacity',
    affectedComponent: 'CoWoS-S Packaging',
    description: 'TSMC CoWoS-S advanced packaging capacity fully allocated through Q3 2025. No slots available for new customer orders. 17 companies on waitlist.',
    mitigation: 'Engage Samsung for alternative 2.5D packaging. Evaluate CoWoS-L as fallback. Negotiate priority allocation with TSMC account team.',
    detectedAt: '2h ago',
  },
  {
    severity: 'high',
    riskType: 'Export Control',
    affectedComponent: 'EUV Lithography Tool',
    description: 'US BIS and Dutch government considering expanded EUV export restrictions. ASML NXE:3600D and High-NA tools may face additional licensing requirements.',
    mitigation: 'Accelerate tool procurement before potential restriction. Engage legal team on ECCN classification. Explore DUV workarounds for <=5nm process.',
    detectedAt: '1d ago',
  },
  {
    severity: 'high',
    riskType: 'Single Source',
    affectedComponent: 'EUV Mask Set',
    description: 'Shin-Etsu is sole qualified supplier for advanced EUV mask blanks. Lead time extended from 18 to 28 weeks due to photoresist shortage upstream.',
    mitigation: 'Qualify Hoya Corporation as second source. Increase safety stock to 16-week buffer. Engage Shin-Etsu on priority queue access.',
    detectedAt: '6h ago',
  },
  {
    severity: 'medium',
    riskType: 'Geopolitical',
    affectedComponent: '3nm Wafers',
    description: 'Cross-strait tensions creating uncertainty around TSMC Taiwan operations. Insurance premiums for Taiwan-origin shipments up 34% QoQ.',
    mitigation: 'Monitor TSMC Arizona N3E ramp timeline. Evaluate Samsung 3GAE as partial alternative. Maintain 8-week inventory buffer.',
    detectedAt: '3d ago',
  },
  {
    severity: 'medium',
    riskType: 'Capacity',
    affectedComponent: 'HBM3 Memory',
    description: 'SK Hynix HBM3 production at 84% utilization. AI accelerator demand surge may push allocation competition in H2 2025.',
    mitigation: 'Secure long-term supply agreement with SK Hynix. Qualify Samsung HBM3 as second source. Monitor Micron HBM3 ramp progress.',
    detectedAt: '4d ago',
  },
  {
    severity: 'low',
    riskType: 'Single Source',
    affectedComponent: '5nm Wafers',
    description: 'Samsung 5LPP capacity adequate for current demand. Minor yield improvement challenges at sub-5% impact level.',
    mitigation: 'Continue monitoring yield metrics. Maintain quarterly review cadence with Samsung foundry team.',
    detectedAt: '1w ago',
  },
]

const severityOrder = ['critical', 'high', 'medium', 'low']

const severityBadge: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-yellow-500 text-gray-950',
  low: 'bg-green-600 text-white',
}

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
}

const riskTypeColor: Record<string, string> = {
  'Capacity': 'bg-purple-900/40 text-purple-400 border-purple-700',
  'Geopolitical': 'bg-blue-900/40 text-blue-400 border-blue-700',
  'Export Control': 'bg-red-900/40 text-red-400 border-red-700',
  'Single Source': 'bg-orange-900/40 text-orange-400 border-orange-700',
}

export default function RiskEngine() {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Risk Engine</h2>
        <p className="text-sm text-gray-400">AI-powered risk detection and mitigation recommendations</p>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
        >
          All ({alerts.length})
        </button>
        {severityOrder.map(s => {
          const count = alerts.filter(a => a.severity === s).length
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${
                filter === s
                  ? s === 'critical' ? 'bg-red-600 text-white'
                  : s === 'high' ? 'bg-orange-600 text-white'
                  : s === 'medium' ? 'bg-yellow-500 text-gray-950'
                  : 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {s} ({count})
            </button>
          )
        })}
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {filtered.map((a, i) => (
          <div key={i} className={`bg-gray-900 rounded-xl border border-gray-800 border-l-4 ${severityBorder[a.severity]} overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${severityBadge[a.severity]}`}>
                    {a.severity.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${riskTypeColor[a.riskType]}`}>
                    {a.riskType}
                  </span>
                  <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded">
                    {a.affectedComponent}
                  </span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{a.detectedAt}</span>
              </div>
              <p className="text-sm text-gray-300 mb-3">{a.description}</p>
              <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                <div className="text-xs font-semibold text-amber-400 mb-1">Recommended Mitigation</div>
                <p className="text-xs text-gray-400">{a.mitigation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
