const components = [
  {
    name: 'HBM3 Memory',
    supplier: 'SK Hynix',
    processNode: '1a nm',
    leadTimeWeeks: 24,
    allocatedTo: 'NVIDIA H100',
    status: 'Allocated',
    riskLevel: 'medium',
  },
  {
    name: 'CoWoS-S Packaging',
    supplier: 'TSMC',
    processNode: 'Advanced Pkg',
    leadTimeWeeks: 32,
    allocatedTo: 'AMD MI300',
    status: 'At Capacity',
    riskLevel: 'critical',
  },
  {
    name: 'EUV Mask Set',
    supplier: 'Shin-Etsu Chemical',
    processNode: 'EUV',
    leadTimeWeeks: 28,
    allocatedTo: 'Apple A18 Pro',
    status: 'Delayed',
    riskLevel: 'high',
  },
  {
    name: '3nm Wafers',
    supplier: 'TSMC',
    processNode: 'N3E',
    leadTimeWeeks: 16,
    allocatedTo: 'Apple A18 Pro',
    status: 'In Production',
    riskLevel: 'medium',
  },
  {
    name: '5nm Wafers',
    supplier: 'Samsung Foundry',
    processNode: '5LPP',
    leadTimeWeeks: 14,
    allocatedTo: 'Qualcomm X75',
    status: 'In Production',
    riskLevel: 'low',
  },
  {
    name: 'EUV Lithography Tool',
    supplier: 'ASML',
    processNode: 'EUV NXE:3600',
    leadTimeWeeks: 52,
    allocatedTo: 'Intel 18A Fab',
    status: 'On Order',
    riskLevel: 'high',
  },
]

const statusStyles: Record<string, string> = {
  'Allocated': 'bg-blue-900/40 text-blue-400 border-blue-700',
  'At Capacity': 'bg-red-900/40 text-red-400 border-red-700',
  'Delayed': 'bg-orange-900/40 text-orange-400 border-orange-700',
  'In Production': 'bg-green-900/40 text-green-400 border-green-700',
  'On Order': 'bg-gray-700 text-gray-300 border-gray-600',
}

const riskStyles: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
}

const riskDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

export default function ComponentsPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Components</h2>
        <p className="text-sm text-gray-400">6 critical components tracked across the supply chain</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Component</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Process</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Lead Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Allocated To</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {components.map(c => (
              <tr key={c.name} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="text-sm font-semibold text-white">{c.name}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-300">{c.supplier}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">{c.processNode}</span>
                </td>
                <td className="px-4 py-4">
                  <div className={`text-sm font-semibold ${c.leadTimeWeeks >= 24 ? 'text-red-400' : c.leadTimeWeeks >= 16 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {c.leadTimeWeeks}w
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-300">{c.allocatedTo}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs border px-2 py-1 rounded font-medium ${statusStyles[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${riskDot[c.riskLevel]}`} />
                    <span className={`text-xs font-semibold capitalize ${riskStyles[c.riskLevel]}`}>{c.riskLevel}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
