const suppliers = [
  {
    name: 'TSMC',
    country: '🇹🇼',
    countryName: 'Taiwan',
    tier: 1,
    capabilities: ['3nm', '5nm', 'CoWoS', 'SoIC'],
    utilization: 97,
    exportControlled: true,
  },
  {
    name: 'Samsung Foundry',
    country: '🇰🇷',
    countryName: 'South Korea',
    tier: 1,
    capabilities: ['3nm', '4nm', 'HBM3', 'V-NAND'],
    utilization: 88,
    exportControlled: true,
  },
  {
    name: 'ASML',
    country: '🇳🇱',
    countryName: 'Netherlands',
    tier: 1,
    capabilities: ['EUV Litho', 'DUV Litho', 'High-NA EUV'],
    utilization: 95,
    exportControlled: true,
  },
  {
    name: 'Lam Research',
    country: '🇺🇸',
    countryName: 'United States',
    tier: 2,
    capabilities: ['Etch', 'Deposition', 'CMP', 'Cleaning'],
    utilization: 79,
    exportControlled: false,
  },
  {
    name: 'SK Hynix',
    country: '🇰🇷',
    countryName: 'South Korea',
    tier: 2,
    capabilities: ['HBM3', 'LPDDR5', 'NAND', 'DDR5'],
    utilization: 84,
    exportControlled: true,
  },
  {
    name: 'Shin-Etsu Chemical',
    country: '🇯🇵',
    countryName: 'Japan',
    tier: 3,
    capabilities: ['EUV Masks', 'Photoresist', 'Silicon Wafers'],
    utilization: 72,
    exportControlled: false,
  },
]

function UtilBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-red-500' : value >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  const textColor = value >= 90 ? 'text-red-400' : value >= 70 ? 'text-yellow-400' : 'text-green-400'
  return (
    <div className="flex items-center gap-2 w-36">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold w-8 ${textColor}`}>{value}%</span>
    </div>
  )
}

export default function SuppliersPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Suppliers</h2>
        <p className="text-sm text-gray-400">6 tracked suppliers across 3 tiers</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Capabilities</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Capacity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {suppliers.map(s => (
              <tr key={s.name} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.country}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.countryName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${
                    s.tier === 1 ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' :
                    s.tier === 2 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                    'bg-gray-700/50 border-gray-600 text-gray-300'
                  }`}>T{s.tier}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {s.capabilities.map(c => (
                      <span key={c} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <UtilBar value={s.utilization} />
                </td>
                <td className="px-4 py-4">
                  {s.exportControlled ? (
                    <span className="text-xs bg-red-900/40 border border-red-700 text-red-400 px-2 py-1 rounded font-semibold">
                      Export Controlled
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded">
                      Unrestricted
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
