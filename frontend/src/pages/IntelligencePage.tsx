import { useState, useEffect } from 'react';
import { Plus, Search, Globe } from 'lucide-react';
import { api } from '../api';
import type { MarketIntelligence } from '../types';

function IntelligenceForm({ item, onSave, onCancel }: { item?: MarketIntelligence; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: item?.title||'', topic: item?.topic||'supply', source: item?.source||'', summary: item?.summary||'', impact_level: item?.impact_level||'medium', affected_components: item?.affected_components||'', analyst: item?.analyst||'', action_items: item?.action_items||'', published_date: item?.published_date?item.published_date.slice(0,10):'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { item ? await api.intelligence.update(item.id, form) : await api.intelligence.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{item ? 'Edit Intelligence' : 'New Intelligence'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Topic</label><select value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} className={inp}>{['supply','demand','price','technology','regulatory','geopolitical'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Impact Level</label><select value={form.impact_level} onChange={e=>setForm({...form,impact_level:e.target.value})} className={inp}>{['critical','high','medium','low'].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Source</label><input value={form.source} onChange={e=>setForm({...form,source:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Analyst</label><input value={form.analyst} onChange={e=>setForm({...form,analyst:e.target.value})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Published Date</label><input type="date" value={form.published_date} onChange={e=>setForm({...form,published_date:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Summary</label><textarea value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} rows={3} className={inp+" resize-none"} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Affected Components</label><input value={form.affected_components} onChange={e=>setForm({...form,affected_components:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Action Items</label><textarea value={form.action_items} onChange={e=>setForm({...form,action_items:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IntelligenceDetail({ item, onEdit, onDelete, onClose }: { item: MarketIntelligence; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const impactColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  const topicColor: Record<string,string> = { supply:'text-blue-400', demand:'text-orange-400', price:'text-green-400', technology:'text-violet-400', regulatory:'text-red-400', geopolitical:'text-amber-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{item.title}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Topic</p><p className={`text-sm font-medium ${topicColor[item.topic]||'text-white'}`}>{item.topic}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Impact</p><p className={`text-sm font-medium ${impactColor[item.impact_level]||'text-white'}`}>{item.impact_level}</p></div>
            {item.source && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Source</p><p className="text-white text-sm">{item.source}</p></div>}
            {item.analyst && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Analyst</p><p className="text-white text-sm">{item.analyst}</p></div>}
            {item.published_date && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Published</p><p className="text-white text-sm">{new Date(item.published_date).toLocaleDateString()}</p></div>}
          </div>
          {item.summary && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Summary</p><p className="text-white text-sm">{item.summary}</p></div>}
          {item.affected_components && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Affected Components</p><p className="text-white text-sm">{item.affected_components}</p></div>}
          {item.action_items && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Action Items</p><p className="text-white text-sm">{item.action_items}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function IntelligencePage() {
  const [items, setItems] = useState<MarketIntelligence[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MarketIntelligence|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MarketIntelligence|undefined>(undefined);
  const load = async () => { const d = await api.intelligence.list(); setItems(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.intelligence.delete(id); setSelected(null); load(); };
  const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.topic?.toLowerCase().includes(search.toLowerCase()) || i.analyst?.toLowerCase().includes(search.toLowerCase()));
  const topicColor: Record<string,string> = { supply:'text-blue-400', demand:'text-orange-400', price:'text-green-400', technology:'text-violet-400', regulatory:'text-red-400', geopolitical:'text-amber-400' };
  const impactColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Market Intelligence</h1><p className="text-gray-400 text-sm mt-1">{items.length} intelligence reports</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Report</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search intelligence..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        <div className="space-y-2">
          {filtered.map(i => (
            <div key={i.id} onClick={()=>setSelected(i)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-700 ${selected?.id===i.id?'border-amber-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Globe className="w-4 h-4 text-amber-400" /></div>
                  <div><div className="font-medium text-white text-sm">{i.title}</div><div className="text-xs text-gray-500">{i.topic} • {i.analyst||'Unknown Analyst'}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${topicColor[i.topic]||'text-white'}`}>{i.topic}</span>
                  <span className={`text-xs font-medium ${impactColor[i.impact_level]||'text-white'}`}>{i.impact_level}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <IntelligenceDetail item={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <IntelligenceForm item={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
