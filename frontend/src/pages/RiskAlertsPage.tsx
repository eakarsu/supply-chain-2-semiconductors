import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import type { RiskAlert, Component, Supplier } from '../types';

function RiskAlertForm({ alert, components, suppliers, onSave, onCancel }: { alert?: RiskAlert; components: Component[]; suppliers: Supplier[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ component_id: alert?.component_id||(components[0]?.id||''), supplier_id: alert?.supplier_id||(suppliers[0]?.id||''), risk_type: alert?.risk_type||'capacity', severity: alert?.severity||'medium', title: alert?.title||'', description: alert?.description||'', impact: alert?.impact||'', mitigation: alert?.mitigation||'', status: alert?.status||'open' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { alert ? await api.riskAlerts.update(alert.id, form) : await api.riskAlerts.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{alert ? 'Edit Risk Alert' : 'New Risk Alert'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Risk Type</label><select value={form.risk_type} onChange={e=>setForm({...form,risk_type:e.target.value})} className={inp}>{['capacity','geopolitical','export_control','single_source','natural_disaster','financial','technology'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Severity</label><select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})} className={inp}>{['critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Component</label><select value={form.component_id} onChange={e=>setForm({...form,component_id:Number(e.target.value)})} className={inp}><option value="">None</option>{components.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Supplier</label><select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:Number(e.target.value)})} className={inp}><option value="">None</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['open','mitigating','resolved','monitoring'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Impact</label><textarea value={form.impact} onChange={e=>setForm({...form,impact:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Mitigation</label><textarea value={form.mitigation} onChange={e=>setForm({...form,mitigation:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RiskAlertDetail({ alert, onEdit, onDelete, onClose }: { alert: RiskAlert; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const sevColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  const statusColor: Record<string,string> = { open:'text-red-400', mitigating:'text-yellow-400', resolved:'text-green-400', monitoring:'text-blue-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{alert.title}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Severity</p><p className={`text-sm font-medium ${sevColor[alert.severity]||'text-white'}`}>{alert.severity}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[alert.status]||'text-white'}`}>{alert.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Risk Type</p><p className="text-white text-sm">{alert.risk_type?.replace(/_/g,' ')}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Detected</p><p className="text-white text-sm">{alert.detected_at ? new Date(alert.detected_at).toLocaleDateString() : 'N/A'}</p></div>
          </div>
          {alert.component_name && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Component</p><p className="text-amber-400 text-sm">{alert.component_name}</p></div>}
          {alert.supplier_name && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Supplier</p><p className="text-amber-400 text-sm">{alert.supplier_name}</p></div>}
          {alert.description && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Description</p><p className="text-white text-sm">{alert.description}</p></div>}
          {alert.impact && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Impact</p><p className="text-white text-sm">{alert.impact}</p></div>}
          {alert.mitigation && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Mitigation</p><p className="text-white text-sm">{alert.mitigation}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function RiskAlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RiskAlert|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<RiskAlert|undefined>(undefined);
  const load = async () => { const [a,c,s] = await Promise.all([api.riskAlerts.list(), api.components.list(), api.suppliers.list()]); setAlerts(a); setComponents(c); setSuppliers(s); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.riskAlerts.delete(id); setSelected(null); load(); };
  const filtered = alerts.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()) || a.risk_type?.toLowerCase().includes(search.toLowerCase()) || a.severity?.toLowerCase().includes(search.toLowerCase()));
  const sevColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  const statusColor: Record<string,string> = { open:'text-red-400', mitigating:'text-yellow-400', resolved:'text-green-400', monitoring:'text-blue-400' };
  const sevBg: Record<string,string> = { critical:'bg-red-900/30 border-red-700/50', high:'bg-orange-900/30 border-orange-700/50', medium:'bg-yellow-900/30 border-yellow-700/50', low:'bg-green-900/30 border-green-700/50' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Risk Alerts</h1><p className="text-gray-400 text-sm mt-1">{alerts.filter(a=>a.status==='open').length} open alerts</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Alert</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search alerts..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} onClick={()=>setSelected(a)} className={`border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-700 ${selected?.id===a.id?'border-amber-500':sevBg[a.severity]||'bg-gray-900 border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><AlertTriangle className={`w-4 h-4 ${sevColor[a.severity]||'text-white'}`} /></div>
                  <div><div className="font-medium text-white text-sm">{a.title}</div><div className="text-xs text-gray-500">{a.risk_type?.replace(/_/g,' ')} • {a.component_name||a.supplier_name||'General'}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${sevColor[a.severity]||'text-white'}`}>{a.severity}</span>
                  <span className={`text-xs font-medium ${statusColor[a.status]||'text-white'}`}>{a.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <RiskAlertDetail alert={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <RiskAlertForm alert={editItem} components={components} suppliers={suppliers} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
