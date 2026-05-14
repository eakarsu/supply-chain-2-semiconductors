const BASE = '/api';
function headers() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: headers() });
  if (!res.ok) {
    if (res.status === 503) {
      let msg = 'AI service unavailable';
      try { const e = await res.json(); msg = e.error || msg; } catch {}
      const err = new Error(msg) as Error & { status?: number };
      err.status = 503;
      throw err;
    }
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
export function apiDownload(path: string, filename: string) {
  const token = localStorage.getItem('token');
  return fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then(r => { if (!r.ok) throw new Error(`API error: ${r.status}`); return r.blob(); })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
}
export const api = {
  login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  suppliers: { list: () => apiFetch('/suppliers'), get: (id: number) => apiFetch(`/suppliers/${id}`), create: (d: object) => apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/suppliers/${id}`, { method: 'DELETE' }) },
  components: { list: () => apiFetch('/components'), get: (id: number) => apiFetch(`/components/${id}`), create: (d: object) => apiFetch('/components', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/components/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/components/${id}`, { method: 'DELETE' }) },
  allocations: { list: () => apiFetch('/allocations'), get: (id: number) => apiFetch(`/allocations/${id}`), create: (d: object) => apiFetch('/allocations', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/allocations/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/allocations/${id}`, { method: 'DELETE' }) },
  riskAlerts: { list: () => apiFetch('/risk-alerts'), get: (id: number) => apiFetch(`/risk-alerts/${id}`), create: (d: object) => apiFetch('/risk-alerts', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/risk-alerts/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/risk-alerts/${id}`, { method: 'DELETE' }) },
  fabs: { list: () => apiFetch('/fabs'), get: (id: number) => apiFetch(`/fabs/${id}`), create: (d: object) => apiFetch('/fabs', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/fabs/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/fabs/${id}`, { method: 'DELETE' }) },
  intelligence: { list: () => apiFetch('/intelligence'), get: (id: number) => apiFetch(`/intelligence/${id}`), create: (d: object) => apiFetch('/intelligence', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/intelligence/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/intelligence/${id}`, { method: 'DELETE' }) },
  ai: {
    riskAssessment: (component_id: number, supplier_id: number) => apiFetch('/ai/risk-assessment', { method: 'POST', body: JSON.stringify({ component_id, supplier_id }) }),
    allocationOptimization: (available_capacity: string, customers: string, priorities: string) => apiFetch('/ai/allocation-optimization', { method: 'POST', body: JSON.stringify({ available_capacity, customers, priorities }) }),
    marketForecast: (component: string, timeframe: string) => apiFetch('/ai/market-forecast', { method: 'POST', body: JSON.stringify({ component, timeframe }) }),
    resilienceReport: (supply_chain_snapshot: object) => apiFetch('/ai/resilience-report', { method: 'POST', body: JSON.stringify({ supply_chain_snapshot }) }),
    foundryAllocator: (foundry: string, total_wafer_starts: string, demand_requests: string, strategic_constraints: string) => apiFetch('/ai/foundry-allocator', { method: 'POST', body: JSON.stringify({ foundry, total_wafer_starts, demand_requests, strategic_constraints }) }),
    leadTimeForecast: (component_id: number, scenario: string) => apiFetch('/ai/lead-time-forecast', { method: 'POST', body: JSON.stringify({ component_id, scenario }) }),
    geopoliticalAnalyzer: (region: string, scenario: string, horizon: string) => apiFetch('/ai/geopolitical-analyzer', { method: 'POST', body: JSON.stringify({ region, scenario, horizon }) }),
    yieldLossPredictor: (component_id: number, process_node_nm: number, defect_signals: string) => apiFetch('/ai/yield-loss-predictor', { method: 'POST', body: JSON.stringify({ component_id, process_node_nm, defect_signals }) }),
    exportCompliance: (destination_country: string, end_use: string, component_id: number, supplier_id: number) => apiFetch('/ai/export-compliance', { method: 'POST', body: JSON.stringify({ destination_country, end_use, component_id, supplier_id }) })
  },
  auditLog: {
    list: (params: Record<string, string|number> = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== '' && v != null).map(([k,v]) => [k, String(v)])).toString();
      return apiFetch('/audit-log' + (qs ? '?' + qs : ''));
    },
    create: (d: object) => apiFetch('/audit-log', { method: 'POST', body: JSON.stringify(d) })
  },
  exportCsv: (entity: string) => apiDownload(`/export/${entity}`, `${entity}-${new Date().toISOString().slice(0,10)}.csv`),
  search: (params: Record<string, string|number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== '' && v != null).map(([k,v]) => [k, String(v)])).toString();
    return apiFetch('/search' + (qs ? '?' + qs : ''));
  }
};
