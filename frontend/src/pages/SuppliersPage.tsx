import { useState, useEffect } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { api } from '../api';
import type { Supplier } from '../types';

function SupplierForm({ supplier, onSave, onCancel }: { supplier?: Supplier; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: supplier?.name||'', country: supplier?.country||'', tier: supplier?.tier||1, city: supplier?.city||'', capabilities: supplier?.capabilities||'', capacity_utilization: supplier?.capacity_utilization||0, export_controlled: supplier?.export_controlled||false, revenue_billions: supplier?.revenue_billions||'', employees: supplier?.employees||'', founded_year: supplier?.founded_year||'', certifications: supplier?.certifications||'', status: supplier?.status||'active' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { supplier ? await api.suppliers.update(supplier.id, form) : await api.suppliers.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{supplier ? 'Edit Supplier' : 'New Supplier'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Country</label><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Tier</label><select value={form.tier} onChange={e=>setForm({...form,tier:Number(e.target.value)})} className={inp}><option value={1}>Tier 1</option><option value={2}>Tier 2</option><option value={3}>Tier 3</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">City</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['active','inactive','at_risk'].map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Capabilities</label><textarea value={form.capabilities} onChange={e=>setForm({...form,capabilities:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Utilization %</label><input type="number" value={form.capacity_utilization} onChange={e=>setForm({...form,capacity_utilization:Number(e.target.value)})} className={inp} /></div>
            <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={form.export_controlled} onChange={e=>setForm({...form,export_controlled:e.target.checked})} className="w-4 h-4" /><label className="text-sm text-gray-300">Export Controlled</label></div>
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

function SupplierDetail({ supplier, onEdit, onDelete, onClose }: { supplier: Supplier; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{supplier.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Country</p><p className="text-white text-sm">{supplier.country}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Tier</p><p className={`text-sm font-medium ${supplier.tier===1?'text-amber-400':'text-white'}`}>Tier {supplier.tier}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Utilization</p><p className={`text-sm font-medium ${Number(supplier.capacity_utilization)>90?'text-red-400':Number(supplier.capacity_utilization)>80?'text-yellow-400':'text-green-400'}`}>{Number(supplier.capacity_utilization).toFixed(1)}%</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Revenue</p><p className="text-white text-sm">${Number(supplier.revenue_billions).toFixed(1)}B</p></div>
          </div>
          {supplier.export_controlled && <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-300 text-sm">Export Controlled - License Required</div>}
          {supplier.capabilities && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Capabilities</p><p className="text-white text-sm">{supplier.capabilities}</p></div>}
          {supplier.certifications && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Certifications</p><p className="text-gray-300 text-xs">{supplier.certifications}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Supplier|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Supplier|undefined>(undefined);
  const load = async () => { const d = await api.suppliers.list(); setSuppliers(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.suppliers.delete(id); setSelected(null); load(); };
  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.country?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Suppliers</h1><p className="text-gray-400 text-sm mt-1">{suppliers.length} semiconductor suppliers</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Supplier</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} onClick={()=>setSelected(s)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-700 ${selected?.id===s.id?'border-amber-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4 text-amber-400" /></div>
                  <div><div className="font-medium text-white text-sm">{s.name}</div><div className="text-xs text-gray-500">{s.country} • Tier {s.tier}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${Number(s.capacity_utilization)>90?'text-red-400':Number(s.capacity_utilization)>80?'text-yellow-400':'text-green-400'}`}>{Number(s.capacity_utilization).toFixed(0)}%</div>
                    <div className="text-xs text-gray-400">utilization</div>
                  </div>
                  {s.export_controlled && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">EAR</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <SupplierDetail supplier={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <SupplierForm supplier={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
