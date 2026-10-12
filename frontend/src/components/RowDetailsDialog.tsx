import { useEffect } from 'react';

export type DetailItem = Record<string, unknown>;

const label = (key: string) =>
  key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

function renderValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * RowDetailsDialog — read-only record details for authoritative traceability
 * rows. Edit and Delete are intentionally unavailable: these records come from
 * bound source systems and retained evidence, so they cannot be mutated inline.
 * Cancel (or Escape, or clicking the backdrop) closes the dialog.
 */
export default function RowDetailsDialog({ title, item, onClose }: { title: string; item: DetailItem; onClose: () => void }) {
  const keys = Object.keys(item);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[85vh] w-[min(44rem,95vw)] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">Record details</span>
            <h2 className="mt-1 text-lg font-semibold">{title}</h2>
          </div>
          <button type="button" aria-label="Cancel" className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800" onClick={onClose}>×</button>
        </div>
        <dl className="space-y-2">
          {keys.map((key) => (
            <div key={key} className="grid grid-cols-[minmax(9rem,32%)_1fr] gap-4 border-b border-slate-800 py-2 text-sm">
              <dt className="font-medium text-slate-400">{label(key)}</dt>
              <dd className="whitespace-pre-wrap break-words text-slate-100">{renderValue(item[key])}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled title="Authoritative source records cannot be edited inline" className="cursor-not-allowed rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-500">Edit</button>
          <button type="button" disabled title="Retained evidence cannot be deleted inline; use the audited workflow" className="cursor-not-allowed rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-500">Delete</button>
          <button type="button" className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
