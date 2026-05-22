import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

type Row = { id: number; osat: string; package: string; week: string; slots: number; customer: string; status: string };
const empty = { osat: '', package: '', week: '', slots: 0, customer: '', status: 'held' };

export default function OsatSlotReservation() {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState({ total: 0, slots: 0, risk: 0 });
  const [form, setForm] = useState(empty);
  async function load() { const d = await apiFetch('/osat-slot-reservation'); setRows(d.reservations || []); setSummary(d.summary || { total: 0, slots: 0, risk: 0 }); }
  useEffect(() => { load(); }, []);
  async function submit(e: React.FormEvent) { e.preventDefault(); await apiFetch('/osat-slot-reservation', { method: 'POST', body: JSON.stringify(form) }); setForm(empty); load(); }
  return <div className="p-6 text-gray-100"><h1 className="text-2xl font-bold mb-2">OSAT Slot Reservation</h1><p className="text-gray-400 mb-6">Package assembly reservations by OSAT, week, customer, and risk state.</p>
    <div className="grid grid-cols-3 gap-4 mb-6">{['total','slots','risk'].map(k => <div key={k} className="bg-gray-900 border border-gray-800 rounded p-4"><div className="text-gray-500 text-sm">{k}</div><div className="text-2xl font-bold">{summary[k as keyof typeof summary]}</div></div>)}</div>
    <form onSubmit={submit} className="grid md:grid-cols-4 gap-3 bg-gray-900 border border-gray-800 rounded p-4 mb-6">{['osat','package','week','customer'].map(f => <input key={f} className="bg-gray-950 border border-gray-700 rounded p-2" placeholder={f} value={(form as any)[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />)}<input className="bg-gray-950 border border-gray-700 rounded p-2" type="number" value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })}/><select className="bg-gray-950 border border-gray-700 rounded p-2" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>held</option><option>risk</option><option>confirmed</option></select><button className="bg-amber-500 text-gray-950 rounded px-4 py-2">Add Slot</button></form>
    <table className="w-full bg-gray-900 border border-gray-800"><thead><tr>{['OSAT','Package','Week','Slots','Customer','Status'].map(h=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t border-gray-800"><td className="p-3">{r.osat}</td><td>{r.package}</td><td>{r.week}</td><td>{r.slots}</td><td>{r.customer}</td><td>{r.status}</td></tr>)}</tbody></table>
  </div>;
}
