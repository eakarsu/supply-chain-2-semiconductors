import { useEffect, useState } from 'react';
import { Network, ChevronRight, AlertTriangle, RefreshCcw } from 'lucide-react';
import { api, apiFetch } from '../api';

type Supplier = { id: number; name: string; country: string; tier: number; capabilities?: string; export_controlled?: boolean };
type Node = { id: number; name: string; country: string; tier: number; depth: number; capabilities?: string; export_controlled?: boolean };
type Edge = { source: number; target: number; relationship_type: string; criticality: string };
type RiskAlert = { id: number; severity: string; title: string; description: string; supplier_id: number };
type RiskPropagation = {
  root_id: number;
  ancestors: { supplier_id: number; name: string; hops_away: number; via_relationship: string; criticality: string }[];
  open_risks: RiskAlert[];
  summary: { critical: number; high: number; medium: number };
};

function critColor(c: string) {
  if (c === 'critical') return 'text-red-400';
  if (c === 'high') return 'text-orange-400';
  if (c === 'medium') return 'text-yellow-400';
  return 'text-gray-400';
}

export default function SupplierGraph() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [depth, setDepth] = useState(3);
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[]; root_id: number } | null>(null);
  const [risk, setRisk] = useState<RiskPropagation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.suppliers.list().then(setSuppliers).catch(() => {}); }, []);

  async function traverse(id: number) {
    setLoading(true); setError('');
    try {
      const [g, r] = await Promise.all([
        apiFetch(`/cf-tier-n-graph/traverse/${id}?depth=${depth}`),
        apiFetch(`/cf-tier-n-graph/risk-propagation/${id}`)
      ]);
      setGraph(g); setRisk(r); setSelectedId(id);
    } catch (e: any) {
      setError(e.message || 'Failed to traverse');
    } finally {
      setLoading(false);
    }
  }

  // Tree structure: edges grouped by source
  const childrenOf = (id: number): { node: Node; edge: Edge }[] => {
    if (!graph) return [];
    return graph.edges
      .filter(e => e.source === id)
      .map(e => ({ edge: e, node: graph.nodes.find(n => n.id === e.target)! }))
      .filter(x => x.node);
  };

  function Branch({ id, level }: { id: number; level: number }) {
    const kids = childrenOf(id);
    if (!kids.length) return null;
    return (
      <ul className={`pl-${Math.min(level * 4, 12)} mt-1 space-y-1`}>
        {kids.map(({ node, edge }) => (
          <li key={`${id}-${node.id}-${edge.relationship_type}`}>
            <div className="flex items-center gap-2 py-1">
              <ChevronRight className="w-3 h-3 text-gray-500" />
              <span className="text-white text-sm">{node.name}</span>
              <span className="text-xs text-gray-500">T{node.tier} · {node.country}</span>
              <span className="text-xs text-amber-300/80">{edge.relationship_type}</span>
              <span className={`text-xs ${critColor(edge.criticality)}`}>[{edge.criticality}]</span>
              {node.export_controlled && <span className="text-[10px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">EAR</span>}
            </div>
            <div className="ml-4 border-l border-gray-800">
              <Branch id={node.id} level={level + 1} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const root = graph?.nodes.find(n => n.id === graph.root_id);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Network className="w-6 h-6 text-amber-400" />Multi-tier Supplier Graph</h1>
        <p className="text-gray-400 text-sm mt-1">Traverse tier-N dependencies (BFS) and propagate open risks up the chain.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm text-gray-300">Depth</label>
            <select value={depth} onChange={e => setDepth(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
            <button onClick={() => selectedId && traverse(selectedId)} disabled={!selectedId || loading} className="ml-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
              {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Refresh
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-1">
            {suppliers.map(s => (
              <button key={s.id} onClick={() => traverse(s.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedId === s.id ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200' : 'hover:bg-gray-800 text-gray-200'}`}>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">T{s.tier} · {s.country}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm">{error}</div>}
          {!graph && <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-gray-500 text-center">Select a supplier to traverse its dependency graph.</div>}
          {graph && root && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-400 uppercase">Root</div>
                  <div className="text-xl font-bold text-amber-400">{root.name}</div>
                  <div className="text-xs text-gray-500">T{root.tier} · {root.country}</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{graph.nodes.length} nodes</div>
                  <div>{graph.edges.length} edges</div>
                </div>
              </div>
              <Branch id={root.id} level={0} />
            </div>
          )}
          {risk && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" />Risk Propagation</h2>
                <div className="text-xs text-gray-400">
                  <span className="text-red-400 mr-2">{risk.summary.critical} critical</span>
                  <span className="text-orange-400 mr-2">{risk.summary.high} high</span>
                  <span className="text-yellow-400">{risk.summary.medium} medium</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-3">{risk.ancestors.length} upstream customer(s) affected.</div>
              {risk.open_risks.length === 0 && <p className="text-gray-500 text-sm">No open risks on this dependency chain.</p>}
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {risk.open_risks.map(r => (
                  <li key={r.id} className="bg-gray-800 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`text-xs uppercase font-bold ${critColor(r.severity)}`}>{r.severity}</span>
                      <span className="text-white">{r.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
