import { useState, useEffect } from 'react';
import { Plus, Search, Cpu } from 'lucide-react';
import { api } from '../api';
import type { Fab } from '../types';

function FabForm({ fab, onSave, onCancel }: { fab?: Fab; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: fab?.name||'', operator: fab?.operator||'', location: fab?.location||'', country: fab?.country||'', process_nodes: fab?.process_nodes||'', monthly_capacity_kwafers: fab?.monthly_capacity_kwafers||'', utilization_pct: fab?.utilization_pct||0, status: fab?.status||'operational', construction_cost_billions: fab?.construction_cost_billions||'', opened_year: fab?.opened_year||'', customers: fab?.customers||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { fab ? await api.fabs.update(fab.id, form) : await api.fabs.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{fab ? 'Edit Fab' : 'New Fab'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Operator</label><input value={form.operator} onChange={e=>setForm({...form,operator:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Country</label><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Location</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['operational','construction','planned','decommissioned'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Utilization %</label><input type="number" min="0" max="100" value={form.utilization_pct} onChange={e=>setForm({...form,utilization_pct:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Process Nodes (nm)</label><input value={form.process_nodes} onChange={e=>setForm({...form,process_nodes:e.target.value})} className={inp} placeholder="e.g., 3, 5, 7" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Capacity (kwafers/mo)</label><input type="number" value={form.monthly_capacity_kwafers} onChange={e=>setForm({...form,monthly_capacity_kwafers:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Opened Year</label><input type="number" value={form.opened_year} onChange={e=>setForm({...form,opened_year:e.target.value})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Construction Cost ($B)</label><input type="number" value={form.construction_cost_billions} onChange={e=>setForm({...form,construction_cost_billions:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Customers</label><input value={form.customers} onChange={e=>setForm({...form,customers:e.target.value})} className={inp} placeholder="comma-separated" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FabDetail({ fab, onEdit, onDelete, onClose }: { fab: Fab; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const statusColor: Record<string,string> = { operational:'text-green-400', construction:'text-yellow-400', planned:'text-blue-400', decommissioned:'text-gray-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{fab.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Operator</p><p className="text-amber-400 text-sm">{fab.operator}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[fab.status]||'text-white'}`}>{fab.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Country</p><p className="text-white text-sm">{fab.country}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Utilization</p><p className={`text-sm font-medium ${Number(fab.utilization_pct)>95?'text-red-400':Number(fab.utilization_pct)>85?'text-yellow-400':'text-white'}`}>{Number(fab.utilization_pct).toFixed(1)}%</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Capacity</p><p className="text-white text-sm">{Number(fab.monthly_capacity_kwafers).toLocaleString()}K w/mo</p></div>
          </div>
          {fab.location && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Location</p><p className="text-white text-sm">{fab.location}</p></div>}
          {fab.process_nodes && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Process Nodes</p><p className="text-white text-sm">{fab.process_nodes}nm</p></div>}
          {fab.construction_cost_billions && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Construction Cost</p><p className="text-white text-sm">${Number(fab.construction_cost_billions).toLocaleString()}B</p></div>}
          {fab.opened_year && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Opened</p><p className="text-white text-sm">{fab.opened_year}</p></div>}
          {fab.customers && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Customers</p><p className="text-white text-sm">{fab.customers}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function FabsPage() {
  const [fabs, setFabs] = useState<Fab[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Fab|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Fab|undefined>(undefined);
  const load = async () => { const d = await api.fabs.list(); setFabs(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.fabs.delete(id); setSelected(null); load(); };
  const filtered = fabs.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.operator?.toLowerCase().includes(search.toLowerCase()) || f.country?.toLowerCase().includes(search.toLowerCase()));
  const statusColor: Record<string,string> = { operational:'text-green-400', construction:'text-yellow-400', planned:'text-blue-400', decommissioned:'text-gray-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Fabs</h1><p className="text-gray-400 text-sm mt-1">{fabs.length} fabrication facilities</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Fab</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fabs..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.id} onClick={()=>setSelected(f)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-700 ${selected?.id===f.id?'border-amber-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Cpu className="w-4 h-4 text-amber-400" /></div>
                  <div><div className="font-medium text-white text-sm">{f.name}</div><div className="text-xs text-gray-500">{f.operator} • {f.country}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${statusColor[f.status]||'text-white'}`}>{f.status}</span>
                  <div className="text-right"><div className={`text-sm font-medium ${Number(f.utilization_pct)>95?'text-red-400':Number(f.utilization_pct)>85?'text-yellow-400':'text-white'}`}>{Number(f.utilization_pct).toFixed(0)}%</div><div className="text-xs text-gray-400">utilization</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <FabDetail fab={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <FabForm fab={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
