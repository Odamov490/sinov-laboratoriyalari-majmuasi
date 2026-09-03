import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';

// Compact "..." menu for secondary, less-frequent row actions (QR, detail, etc).
export default function RowActionsMenu({ items }) {
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

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-bg-light text-slate-500 focus-ring"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-border bg-white py-1 shadow-2xl">
          {items.map((it, i) =>
            it.to ? (
              <Link
                key={i}
                to={it.to}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-bg-light"
              >
                {it.icon && <it.icon className="h-3.5 w-3.5 text-slate-400" />}
                {it.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-bg-light"
              >
                {it.icon && <it.icon className="h-3.5 w-3.5 text-slate-400" />}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
