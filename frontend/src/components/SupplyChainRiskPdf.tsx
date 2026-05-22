import { useState } from 'react';
import { FileDown, ShieldAlert } from 'lucide-react';

export default function SupplyChainRiskPdf() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const download = async () => {
    setBusy(true); setMsg('');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/custom-views/risk-report.pdf', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supply-chain-risk-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('Report downloaded.');
    } catch (e) {
      setMsg('Error: ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg"><ShieldAlert className="w-5 h-5 text-amber-400" /></div>
        <div className="flex-1">
          <h3 className="text-white font-semibold">Supply Chain Risk Report</h3>
          <p className="text-gray-400 text-sm mt-1">Generate a PDF brief covering CoWoS, HBM, geopolitics, and ECCN exposures.</p>
        </div>
      </div>
      <button
        onClick={download}
        disabled={busy}
        className="mt-4 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold px-4 py-2 rounded-lg transition-colors"
      >
        <FileDown className="w-4 h-4" />{busy ? 'Generating...' : 'Download PDF'}
      </button>
      {msg && <p className="text-xs text-gray-400 mt-2">{msg}</p>}
    </div>
  );
}
