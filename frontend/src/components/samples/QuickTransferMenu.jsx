import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Send } from 'lucide-react';

// Row-level "send to lab" control: click to open an inline lab list, click a
// lab to send immediately (no confirm step, no modal) — 2 clicks total.
export default function QuickTransferMenu({ labs, excludeLabId, onSelect, busy, label = 'Yuborish' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const options = labs.filter((l) => l.id !== excludeLabId);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" /> {label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-56 max-h-72 overflow-y-auto rounded-lg border border-border bg-white py-1.5 shadow-2xl">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">Laboratoriyalar topilmadi</p>
          ) : (
            options.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setOpen(false);
                  onSelect(l.id);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-bg-light"
              >
                {l.nameUz}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
