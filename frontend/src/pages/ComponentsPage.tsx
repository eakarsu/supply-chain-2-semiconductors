import { useState, useEffect } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { api } from '../api';
import type { Component, Supplier } from '../types';

function ComponentForm({ component, suppliers, onSave, onCancel }: { component?: Component; suppliers: Supplier[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: component?.name||'', type: component?.type||'logic_chip', process_node_nm: component?.process_node_nm||'', supplier_id: component?.supplier_id||(suppliers[0]?.id||''), lead_time_weeks: component?.lead_time_weeks||26, allocated_to: component?.allocated_to||'', status: component?.status||'available', monthly_capacity_k_units: component?.monthly_capacity_k_units||'', current_allocation_pct: component?.current_allocation_pct||0, price_usd: component?.price_usd||'', criticality: component?.criticality||'medium' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { component ? await api.components.update(component.id, form) : await api.components.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{component ? 'Edit Component' : 'New Component'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Supplier</label><select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:Number(e.target.value)})} className={inp}>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className={inp}>{['logic_chip','memory','packaging','substrate','mask','chemical','equipment','IP'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Criticality</label><select value={form.criticality} onChange={e=>setForm({...form,criticality:e.target.value})} className={inp}>{['critical','high','medium','low'].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Process Node (nm)</label><input type="number" value={form.process_node_nm} onChange={e=>setForm({...form,process_node_nm:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Lead Time (weeks)</label><input type="number" value={form.lead_time_weeks} onChange={e=>setForm({...form,lead_time_weeks:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['available','constrained','allocated','discontinued'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Alloc. %</label><input type="number" value={form.current_allocation_pct} onChange={e=>setForm({...form,current_allocation_pct:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComponentDetail({ component, onEdit, onDelete, onClose }: { component: Component; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const critColor: Record<string,string> = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-green-400' };
  const statusColor: Record<string,string> = { available: 'text-green-400', constrained: 'text-yellow-400', allocated: 'text-orange-400', discontinued: 'text-red-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{component.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Supplier</p><p className="text-amber-400 text-sm">{component.supplier_name}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Type</p><p className="text-white text-sm">{component.type}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Criticality</p><p className={`text-sm font-medium ${critColor[component.criticality]||'text-white'}`}>{component.criticality}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[component.status]||'text-white'}`}>{component.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Alloc.</p><p className={`text-sm font-medium ${Number(component.current_allocation_pct)>95?'text-red-400':'text-white'}`}>{Number(component.current_allocation_pct).toFixed(1)}%</p></div>
            {component.process_node_nm && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Process</p><p className="text-white text-sm">{component.process_node_nm}nm</p></div>}
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Lead Time</p><p className="text-white text-sm">{component.lead_time_weeks}wk</p></div>
          </div>
          {component.allocated_to && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Allocated To</p><p className="text-white text-sm">{component.allocated_to}</p></div>}
          {component.price_usd && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Unit Price</p><p className="text-white text-sm">${Number(component.price_usd).toLocaleString()}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Component|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Component|undefined>(undefined);
  const load = async () => { const [c,s] = await Promise.all([api.components.list(), api.suppliers.list()]); setComponents(c); setSuppliers(s); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.components.delete(id); setSelected(null); load(); };
  const filtered = components.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.type?.toLowerCase().includes(search.toLowerCase()) || c.supplier_name?.toLowerCase().includes(search.toLowerCase()));
  const critColor: Record<string,string> = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-green-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Components</h1><p className="text-gray-400 text-sm mt-1">{components.length} components tracked</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Component</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search components..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} onClick={()=>setSelected(c)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-700 ${selected?.id===c.id?'border-amber-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-amber-400" /></div>
                  <div><div className="font-medium text-white text-sm">{c.name}</div><div className="text-xs text-gray-500">{c.supplier_name} • {c.type}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${critColor[c.criticality]||'text-white'}`}>{c.criticality}</span>
                  <div className="text-right"><div className={`text-sm ${Number(c.current_allocation_pct)>95?'text-red-400':Number(c.current_allocation_pct)>85?'text-yellow-400':'text-white'}`}>{Number(c.current_allocation_pct).toFixed(0)}%</div><div className="text-xs text-gray-400">alloc.</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <ComponentDetail component={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <ComponentForm component={editItem} suppliers={suppliers} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
