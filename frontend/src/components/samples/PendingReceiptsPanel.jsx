import React, { useEffect, useState } from 'react';
import { PackageCheck, Loader2 } from 'lucide-react';
import { adminSamples } from '../../services/adminApi';

// Highlighted "inbox" of in-transit samples. Resolves each sample's intended
// destination lab from its movement history in the background so receiving
// is a single click (the backend still requires toLabId per action, but the
// admin never has to pick it manually here — it's already known).
export default function PendingReceiptsPanel({ items, myLabId, onReceive, busyId }) {
  const [destinations, setDestinations] = useState({});
  const [onlyMine, setOnlyMine] = useState(!!myLabId);

  useEffect(() => {
    let cancelled = false;
    const missing = items.filter((s) => !destinations[s.id]);
    if (missing.length === 0) return undefined;

    Promise.all(
      missing.map((s) =>
        adminSamples
          .get(s.id)
          .then((full) => {
            const last = (full.movements || []).find((m) => m.action === 'CHIQARISH');
            return [s.id, last ? { toLabId: last.toLabId, toLabName: last.toLab?.nameUz } : null];
          })
          .catch(() => [s.id, null])
      )
    ).then((pairs) => {
      if (cancelled) return;
      setDestinations((prev) => {
        const next = { ...prev };
        pairs.forEach(([id, val]) => {
          if (val) next[id] = val;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (items.length === 0) return null;

  const visible = onlyMine && myLabId ? items.filter((s) => destinations[s.id]?.toLabId === myLabId) : items;

  return (
    <div className="mb-6 rounded-xl border border-accent/40 bg-accent/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-ink flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-accent" /> Kutilayotgan qabullar ({visible.length})
        </h2>
        {myLabId && (
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-primary"
            />
            Faqat menga kelayotgan
          </label>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-500">Sizga kelayotgan namunalar yo'q.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((s) => {
            const dest = destinations[s.id];
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white border border-border px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-primary font-semibold">{s.code}</p>
                  <p className="text-sm font-medium text-ink truncate">{s.productName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {s.originLab?.nameUz} →{' '}
                    {dest ? (
                      <span className="font-medium text-ink">{dest.toLabName}</span>
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </p>
                </div>
                <button
                  onClick={() => dest && onReceive(s, dest.toLabId)}
                  disabled={!dest || busyId === s.id}
                  className="btn-primary !py-2 !px-3 text-xs shrink-0"
                >
                  {busyId === s.id ? 'Qabul qilinmoqda...' : 'Qabul qildim'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
