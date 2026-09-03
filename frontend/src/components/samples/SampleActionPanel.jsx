import React, { useState } from 'react';
import { ArrowRightLeft, PackageCheck, CheckCircle2 } from 'lucide-react';
import { Select } from '../UI.jsx';

// Full status -> action flow (send / receive / finish), used on the scanner
// and sample-detail pages where the destination lab isn't known in advance.
export default function SampleActionPanel({ sample, labs, onAction, busy }) {
  const [destLabId, setDestLabId] = useState('');
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);

  const run = (action) => {
    if ((action === 'CHIQARISH' || action === 'QABUL_QILISH') && !destLabId) return;
    onAction(action, { toLabId: destLabId || undefined, notes });
    setDestLabId('');
    setNotes('');
    setNotesOpen(false);
  };

  if (sample.status === 'YAKUNLANDI') {
    return (
      <p className="text-sm text-slate-500 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ushbu namuna bo'yicha ish yakunlangan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sample.status === 'LABORATORIYADA' && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Qaysi laboratoriyaga jo'natilmoqda?</label>
          <Select
            value={destLabId}
            onChange={setDestLabId}
            placeholder="Laboratoriyani tanlang"
            options={labs.filter((l) => l.id !== sample.currentLabId).map((l) => ({ value: l.id, label: l.nameUz }))}
          />
        </div>
      )}
      {sample.status === 'TASHILMOQDA' && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Qaysi laboratoriya qabul qilmoqda?</label>
          <Select
            value={destLabId}
            onChange={setDestLabId}
            placeholder="Laboratoriyani tanlang"
            options={labs.map((l) => ({ value: l.id, label: l.nameUz }))}
          />
        </div>
      )}

      {notesOpen ? (
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Izoh (ixtiyoriy)"
          className="input-field text-sm"
          autoFocus
        />
      ) : (
        <button onClick={() => setNotesOpen(true)} className="text-xs text-slate-400 hover:text-primary">
          + Izoh qo'shish
        </button>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        {sample.status === 'LABORATORIYADA' && (
          <>
            <button onClick={() => run('CHIQARISH')} disabled={busy || !destLabId} className="btn-primary !py-2.5">
              <ArrowRightLeft className="h-4 w-4" /> Chiqarish
            </button>
            <button onClick={() => run('YAKUNLASH')} disabled={busy} className="btn-secondary !py-2.5">
              <CheckCircle2 className="h-4 w-4" /> Yakunlash
            </button>
          </>
        )}
        {sample.status === 'TASHILMOQDA' && (
          <button onClick={() => run('QABUL_QILISH')} disabled={busy || !destLabId} className="btn-primary !py-2.5">
            <PackageCheck className="h-4 w-4" /> Qabul qilish
          </button>
        )}
      </div>
    </div>
  );
}
