import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCcw } from 'lucide-react';
import { apiFetch } from '../api';

type ClassifyResult = {
  id: number | null;
  eccn: string;
  eccn_description: string;
  controls: string;
  hts: string;
  destination_country: string;
  license_required: boolean;
  license_exception_candidates: string[];
  reasoning: string;
  alternatives: { code: string; description: string; controls: string }[];
  llm_used: boolean;
};
type Recent = {
  id: number;
  eccn: string;
  hts: string;
  destination_country: string;
  license_required: boolean;
  classified_at: string;
  component_name?: string;
};

const COUNTRIES = ['United States', 'Japan', 'South Korea', 'Taiwan', 'Germany', 'Netherlands', 'United Kingdom', 'China', 'Russia', 'Iran', 'North Korea', 'Cuba', 'Syria', 'Israel', 'Singapore'];

export default function EccnClassifier() {
  const [form, setForm] = useState({ name: '', specs: '', intended_use: '', destination_country: 'China' });
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';

  async function loadRecent() {
    try {
      const r = await apiFetch('/gap-ai-ear-eccn-classifier/classifications');
      setRecent(r);
    } catch (e: any) {
      // tolerate empty
    }
  }
  useEffect(() => { loadRecent(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await apiFetch('/gap-ai-ear-eccn-classifier/classify', {
        method: 'POST', body: JSON.stringify(form)
      });
      setResult(r);
      await loadRecent();
    } catch (e: any) {
      setError(e.message || 'Classification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-amber-400" />Export Compliance — EAR/ECCN/HTS Classifier</h1>
        <p className="text-gray-400 text-sm mt-1">Match an item against the BIS Commerce Control List and apply destination-specific licensing rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Item name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} placeholder="e.g. NVIDIA H200 SXM GPU" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Specs / technical detail</label>
            <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} rows={3} className={inp + ' resize-none'} placeholder="e.g. 141 GB HBM3e, 4.8 TB/s bandwidth, FP16 1979 TFLOPS" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Intended end-use</label>
            <textarea value={form.intended_use} onChange={e => setForm({ ...form, intended_use: e.target.value })} rows={2} className={inp + ' resize-none'} placeholder="e.g. AI training cluster for hyperscaler" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Destination country</label>
            <select value={form.destination_country} onChange={e => setForm({ ...form, destination_country: e.target.value })} className={inp}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
            {loading && <RefreshCcw className="w-4 h-4 animate-spin" />}
            {loading ? 'Classifying...' : 'Classify'}
          </button>
          {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm">{error}</div>}
        </form>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          {!result && <p className="text-gray-500 text-sm">Submit the form to see a classification result.</p>}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 uppercase">ECCN</div>
                  <div className="text-2xl font-bold text-amber-400">{result.eccn}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase">HTS</div>
                  <div className="text-lg font-mono text-white">{result.hts}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase">License?</div>
                  <div className={`text-lg font-bold ${result.license_required ? 'text-red-400' : 'text-green-400'}`}>
                    {result.license_required ? 'REQUIRED' : 'NLR / Allowed'}
                  </div>
                </div>
              </div>
              {result.eccn_description && (
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Description</p><p className="text-white text-sm">{result.eccn_description}</p></div>
              )}
              {result.controls && (
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Controls</p><p className="text-white text-sm">{result.controls}</p></div>
              )}
              {result.license_required && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-200 text-sm flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Export to <b>{result.destination_country}</b> requires a license. Candidate exceptions: {result.license_exception_candidates.length ? result.license_exception_candidates.join(', ') : '(none — full license application)'}</span>
                </div>
              )}
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Reasoning {result.llm_used && <span className="text-violet-300">(LLM-augmented)</span>}</p>
                <pre className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">{result.reasoning}</pre>
              </div>
              {result.alternatives?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-2">Alternative candidates</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {result.alternatives.map(a => (
                      <li key={a.code}><span className="text-amber-300 font-mono">{a.code}</span> — {a.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">Recent classifications</h2>
        {recent.length === 0 && <p className="text-gray-500 text-sm">No classifications yet.</p>}
        {recent.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr><th className="py-2 pr-4">When</th><th className="py-2 pr-4">ECCN</th><th className="py-2 pr-4">HTS</th><th className="py-2 pr-4">Destination</th><th className="py-2 pr-4">License</th><th className="py-2">Component</th></tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} className="border-b border-gray-800/60">
                    <td className="py-2 pr-4 text-gray-400">{new Date(r.classified_at).toLocaleString()}</td>
                    <td className="py-2 pr-4 font-mono text-amber-300">{r.eccn}</td>
                    <td className="py-2 pr-4 font-mono text-gray-300">{r.hts}</td>
                    <td className="py-2 pr-4 text-gray-200">{r.destination_country}</td>
                    <td className={`py-2 pr-4 font-medium ${r.license_required ? 'text-red-400' : 'text-green-400'}`}>{r.license_required ? 'Required' : 'NLR'}</td>
                    <td className="py-2 text-gray-300">{r.component_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
