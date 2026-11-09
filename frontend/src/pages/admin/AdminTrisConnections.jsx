import React, { useCallback, useEffect, useState } from 'react';
import { PlugZap, RefreshCw, Link2Off, CheckCircle2, XCircle } from 'lucide-react';
import { adminTris } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, ErrorState, EmptyState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { apiErr, fmtDateTime } from './profile/ProfileGeneral.jsx';
import { STATUS_LABELS, testMessage } from './profile/ProfileIntegrations.jsx';
import { tr } from '../../i18n/tr.js';

// SUPER_ADMIN: barcha tris ulanishlari (tokenlarsiz), majburan uzish va
// sozlama holati (faqat "o'rnatilgan / o'rnatilmagan").
const STATUS_CLS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-amber-100 text-amber-800',
  REVOKED: 'bg-slate-100 text-slate-600',
  ERROR: 'bg-red-100 text-red-700',
};

export default function AdminTrisConnections() {
  const { showToast } = useToast();
  const [items, setItems] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [results, setResults] = useState({});

  const load = useCallback(() => {
    setError(null);
    Promise.all([adminTris.connections(), adminTris.config()])
      .then(([c, conf]) => {
        setItems(c.items);
        setCfg(conf);
      })
      .catch((err) => setError(apiErr(err)));
  }, []);
  useEffect(load, [load]);

  const test = async (row) => {
    setBusy(`test:${row.userId}`);
    try {
      const r = testMessage(await adminTris.testUser(row.userId));
      setResults((m) => ({ ...m, [row.userId]: r }));
      load();
    } catch (err) {
      setResults((m) => ({ ...m, [row.userId]: { type: 'error', text: apiErr(err) } }));
    } finally {
      setBusy(null);
    }
  };

  const forceDisconnect = async () => {
    const row = confirm;
    setBusy(`off:${row.userId}`);
    try {
      await adminTris.forceDisconnect(row.userId);
      showToast(tr('{0}: tris ulanishi uzildi.', row.fullName), 'success');
      setConfirm(null);
      load();
    } catch (err) {
      showToast(apiErr(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items || !cfg) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <PlugZap className="h-6 w-6 text-primary" /> {tr('Tris ulanishlari')}
          </h1>
          <p className="text-sm text-slate-500">{tr("Xodimlarning tris hisoblari bilan bog'lanishi. Tokenlar shifrlangan va bu yerda ko'rsatilmaydi.")}</p>
        </div>
        <button type="button" onClick={load} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> {tr('Yangilash')}
        </button>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-ink">{tr('Sozlama holati')}</p>
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${cfg.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            {cfg.configured ? tr('Sozlangan') : tr('Sozlanmagan')}
          </span>
          {cfg.mock && <span className="rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700">{tr('SOXTA provayder (ishlab chiqish)')}</span>}
        </div>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {cfg.settings.map((s) => (
            <li key={s.name} className="flex items-center gap-2">
              {s.set ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="h-4 w-4 shrink-0 text-slate-300" />}
              <span className={`font-mono text-xs ${cfg.missing.includes(s.name) ? 'font-semibold text-red-600' : 'text-slate-600'}`}>{s.name}</span>
            </li>
          ))}
        </ul>
        {cfg.missing.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {tr("Qizil — majburiy, lekin yo'q yoki noto'g'ri. Qiymatlar serverdagi .env faylida, bu yerda ko'rsatilmaydi.")}
          </p>
        )}
      </div>

      <div className="card overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState message={tr("Hali hech kim tris hisobini bog'lamagan.")} />
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{tr('Foydalanuvchi')}</th>
                <th className="px-4 py-3">{tr('Laboratoriya')}</th>
                <th className="px-4 py-3">{tr('Holat')}</th>
                <th className="px-4 py-3">{tr("Bog'langan")}</th>
                <th className="px-4 py-3">{tr('Oxirgi ishlatilgan')}</th>
                <th className="px-4 py-3">{tr('Token muddati')}</th>
                <th className="px-4 py-3 text-right">{tr('Amallar')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => (
                <tr key={r.userId} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{r.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {r.login}
                      {r.trisDisplayName ? ` · tris: ${r.trisDisplayName}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.laboratory || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status] || ''}`}>{STATUS_LABELS[r.status] || r.status}</span>
                    {r.lastErrorCode && <p className="mt-1 font-mono text-[11px] text-slate-400">{r.lastErrorCode}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmtDateTime(r.connectedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDateTime(r.lastUsedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDateTime(r.accessExpiresAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => test(r)}
                        disabled={Boolean(busy) || !cfg.configured}
                        className="btn-secondary inline-flex items-center gap-1.5 !px-3 !py-1.5 text-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${busy === `test:${r.userId}` ? 'animate-spin' : ''}`} /> {tr('Tekshirish')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirm(r)}
                        disabled={Boolean(busy)}
                        className="btn-secondary inline-flex items-center gap-1.5 !px-3 !py-1.5 text-xs text-red-600 disabled:opacity-50"
                      >
                        <Link2Off className="h-3.5 w-3.5" /> {tr('Uzish')}
                      </button>
                    </div>
                    {results[r.userId] && (
                      <p className={`mt-1.5 text-right text-xs ${results[r.userId].type === 'success' ? 'text-emerald-700' : results[r.userId].type === 'info' ? 'text-sky-700' : 'text-red-600'}`}>
                        {results[r.userId].text}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title={tr('Ulanishni majburan uzish')} size="sm">
        <p className="text-sm text-slate-600">
          {tr("{0} ning tris ulanishi uziladi va tokenlari o'chiriladi. Xodim keyin o'zi qayta bog'lashi mumkin.", confirm?.fullName || '')}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirm(null)} className="btn-secondary">
            {tr('Bekor qilish')}
          </button>
          <button type="button" onClick={forceDisconnect} disabled={Boolean(busy)} className="btn-primary !bg-red-600 hover:!bg-red-700 disabled:opacity-50">
            {tr('Uzish')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
