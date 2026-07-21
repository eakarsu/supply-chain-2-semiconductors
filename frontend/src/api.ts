const BASE = '/api';

function headers() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, { ...options, headers: headers() });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.error?.message || message; } catch { /* non-JSON failure */ }
    if (response.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); }
    const error = new Error(message) as Error & { status?: number }; error.status = response.status; throw error;
  }
  return response.json();
}

export const api = {
  login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  traceability: {
    dashboard: () => apiFetch('/traceability/dashboard'),
    ingest: (event: object) => apiFetch('/traceability/events', { method: 'POST', body: JSON.stringify(event) }),
    createPlan: (planningKey: string) => apiFetch('/traceability/plans', { method: 'POST', body: JSON.stringify({ planningKey }) }),
    approvePlan: (id: string, body: object) => apiFetch(`/traceability/plans/${id}/approval`, { method: 'POST', body: JSON.stringify(body) }),
    rollbackPlan: (id: string, reason: string) => apiFetch(`/traceability/plans/${id}/rollback`, { method: 'POST', body: JSON.stringify({ reason }) }),
    decideException: (id: string, body: object) => apiFetch(`/traceability/exceptions/${id}/decision`, { method: 'POST', body: JSON.stringify(body) }),
  },
};
