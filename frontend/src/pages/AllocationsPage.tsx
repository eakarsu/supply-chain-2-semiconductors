import { useState, useEffect } from 'react';
import { Plus, Search, BarChart3 } from 'lucide-react';
import { api } from '../api';
import type { Allocation, Component } from '../types';

function AllocationForm({ allocation, components, onSave, onCancel }: { allocation?: Allocation; components: Component[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ component_id: allocation?.component_id||(components[0]?.id||''), customer: allocation?.customer||'', quantity_k_units: allocation?.quantity_k_units||'', priority: allocation?.priority||5, locked_until: allocation?.locked_until?allocation.locked_until.slice(0,10):'', status: allocation?.status||'provisional', contract_value_millions: allocation?.contract_value_millions||'', notes: allocation?.notes||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { allocation ? await api.allocations.update(allocation.id, form) : await api.allocations.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{allocation ? 'Edit Allocation' : 'New Allocation'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Component</label><select value={form.component_id} onChange={e=>setForm({...form,component_id:Number(e.target.value)})} className={inp}>{components.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Customer</label><input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Quantity (K units)</label><input type="number" value={form.quantity_k_units} onChange={e=>setForm({...form,quantity_k_units:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Priority (1=highest)</label><input type="number" min="1" max="10" value={form.priority} onChange={e=>setForm({...form,priority:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['confirmed','provisional','at_risk','cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Contract Value ($M)</label><input type="number" value={form.contract_value_millions} onChange={e=>setForm({...form,contract_value_millions:e.target.value})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Locked Until</label><input type="date" value={form.locked_until} onChange={e=>setForm({...form,locked_until:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AllocationDetail({ allocation, onEdit, onDelete, onClose }: { allocation: Allocation; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const statusColor: Record<string,string> = { confirmed:'text-green-400', provisional:'text-yellow-400', at_risk:'text-red-400', cancelled:'text-gray-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{allocation.customer}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Component</p><p className="text-amber-400 text-sm">{allocation.component_name}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[allocation.status]||'text-white'}`}>{allocation.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Priority</p><p className="text-white text-sm">{allocation.priority}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Quantity</p><p className="text-white text-sm">{allocation.quantity_k_units}K units</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Contract Value</p><p className="text-white text-sm">${Number(allocation.contract_value_millions).toLocaleString()}M</p></div>
          </div>
          {allocation.locked_until && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Locked Until</p><p className="text-white text-sm">{new Date(allocation.locked_until).toLocaleDateString()}</p></div>}
          {allocation.notes && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Notes</p><p className="text-white text-sm">{allocation.notes}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Allocation|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Allocation|undefined>(undefined);
  const load = async () => { const [a,c] = await Promise.all([api.allocations.list(), api.components.list()]); setAllocations(a); setComponents(c); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.allocations.delete(id); setSelected(null); load(); };
  const filtered = allocations.filter(a => a.customer?.toLowerCase().includes(search.toLowerCase()) || a.component_name?.toLowerCase().includes(search.toLowerCase()));
  const statusColor: Record<string,string> = { confirmed:'text-green-400', provisional:'text-yellow-400', at_risk:'text-red-400', cancelled:'text-gray-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Allocations</h1><p className="text-gray-400 text-sm mt-1">{allocations.length} capacity allocations</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Allocation</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search allocations..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} onClick={()=>setSelected(a)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-700 ${selected?.id===a.id?'border-amber-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><BarChart3 className="w-4 h-4 text-amber-400" /></div>
                  <div><div className="font-medium text-white text-sm">{a.customer}</div><div className="text-xs text-gray-500">{a.component_name} • P{a.priority}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${statusColor[a.status]||'text-white'}`}>{a.status}</span>
                  <div className="text-right"><div className="text-sm font-medium text-white">${Number(a.contract_value_millions).toLocaleString()}M</div><div className="text-xs text-gray-400">{a.quantity_k_units}K units</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <AllocationDetail allocation={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <AllocationForm allocation={editItem} components={components} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
