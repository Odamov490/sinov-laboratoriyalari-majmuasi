import React, { useEffect, useState } from 'react';
import { Plus, Printer, ArrowRightLeft, PackageCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { adminSamples, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  LABORATORIYADA: 'Laboratoriyada',
  TASHILMOQDA: 'Tashilmoqda',
  YAKUNLANDI: 'Yakunlandi',
};

const STATUS_STYLES = {
  LABORATORIYADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TASHILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  YAKUNLANDI: 'bg-slate-100 text-slate-600 border-slate-200',
};

function isOverdue(sample) {
  if (!sample.dueDate || sample.status === 'YAKUNLANDI') return false;
  return new Date(sample.dueDate) < new Date();
}

export default function AdminSamples() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [labs, setLabs] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ productName: '', description: '', originLabId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const [qrItem, setQrItem] = useState(null);

  const [actionItem, setActionItem] = useState(null);
  const [destLabId, setDestLabId] = useState('');
  const [notes, setNotes] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const load = () => {
    setError(false);
    adminSamples.list({ pageSize: 100 }).then(setData).catch(() => setError(true));
  };

  useEffect(() => {
    load();
    adminSamples.stats().then(setStats).catch(() => {});
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  const openCreate = () => {
    setForm({ productName: '', description: '', originLabId: '', dueDate: '' });
    setCreateOpen(true);
  };

  const createSample = async () => {
    if (!form.productName || !form.originLabId) {
      showToast('Mahsulot nomi va laboratoriyani kiriting.', 'error');
      return;
    }
    setSaving(true);
    try {
      const sample = await adminSamples.create({
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      showToast(`Namuna ro'yxatga olindi: ${sample.code}`, 'success');
      setCreateOpen(false);
      load();
      setQrItem(sample);
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const printQr = () => window.print();

  const openAction = (sample) => {
    setActionItem(sample);
    setDestLabId('');
    setNotes('');
  };

  const doAction = async (action) => {
    if ((action === 'CHIQARISH' || action === 'QABUL_QILISH') && !destLabId) {
      showToast('Laboratoriyani tanlang.', 'error');
      return;
    }
    setActionBusy(true);
    try {
      await adminSamples.action(actionItem.id, { action, toLabId: destLabId || undefined, notes });
      showToast('Amal bajarildi.', 'success');
      setActionItem(null);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-ink">Namunalar</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Yangi namuna ro'yxatga olish
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Namunani ro'yxatga oling, QR yorliqni chop eting va namunaga yopishtiring. Namunani boshqa
        laboratoriyaga jo'natish yoki qabul qilish uchun jadvaldagi "Harakat" tugmasidan foydalaning.
      </p>

      {stats && (
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            {stats.perLab.map((l) => (
              <div key={l.labId} className="card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{l.count}</p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{l.labName}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-lg">
                {stats.inTransitCount}
              </div>
              <div>
                <p className="font-semibold text-ink">Tashilmoqda</p>
                <p className="text-xs text-slate-500">Hozir yo'lda bo'lgan namunalar</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 font-bold text-lg">
                {stats.overdueCount}
              </div>
              <div>
                <p className="font-semibold text-ink">Muddati o'tgan</p>
                <p className="text-xs text-slate-500">Belgilangan muddatdan kechikkan</p>
              </div>
            </div>
          </div>
          {stats.last30Days.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-ink mb-3">Oxirgi 30 kun: kirim / chiqim</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="in" stroke="#0B3A63" name="Ro'yxatga olindi" strokeWidth={2} />
                  <Line type="monotone" dataKey="out" stroke="#E8A33D" name="Yakunlandi" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState message="Hali namuna ro'yxatga olinmagan." />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Kelib chiqishi</th>
                <th className="px-4 py-3">Hozirgi joyi</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Muddat</th>
                <th className="px-4 py-3 text-right">QR</th>
                <th className="px-4 py-3 text-right">Harakat</th>
                <th className="px-4 py-3 text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((s) => {
                const overdue = isOverdue(s);
                return (
                  <tr key={s.id} className={`hover:bg-bg-light/60 ${overdue ? 'bg-red-50/60' : ''}`}>
                    <td className="px-4 py-3 font-mono text-primary">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-ink">{s.productName}</td>
                    <td className="px-4 py-3 text-slate-600">{s.originLab?.nameUz}</td>
                    <td className="px-4 py-3 text-slate-600">{s.currentLab?.nameUz || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.dueDate ? (
                        <span className={`flex items-center gap-1.5 text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                          {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                          {formatDate(s.dueDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setQrItem(s)} className="text-sm font-medium text-primary hover:underline">
                        QR ko'rish
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== 'YAKUNLANDI' ? (
                        <button onClick={() => openAction(s)} className="text-sm font-medium text-primary hover:underline">
                          Harakat
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/namunalar/${s.id}`} className="text-sm font-medium text-slate-500 hover:text-primary hover:underline">
                        Batafsil
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi namuna" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Mahsulot nomi</label>
            <input
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="input-field"
              placeholder="Masalan: Elektr kabel namunasi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Laboratoriya (qayerdan kelgan)</label>
            <Select
              value={form.originLabId}
              onChange={(v) => setForm({ ...form, originLabId: v })}
              placeholder="Laboratoriyani tanlang"
              options={labs.map((l) => ({ value: l.id, label: l.nameUz }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Kutilayotgan yakunlash sanasi (ixtiyoriy)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Izoh (ixtiyoriy)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <button onClick={createSample} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saqlanmoqda...' : "Ro'yxatga olish"}
          </button>
        </div>
      </Modal>

      <Modal open={!!qrItem} onClose={() => setQrItem(null)} title="QR yorliq" size="sm">
        {qrItem && (
          <div className="text-center">
            <div id="qr-print-area" className="inline-block p-6 border border-border rounded-xl">
              <QRCodeSVG value={qrItem.code} size={180} />
              <p className="mt-3 font-mono font-bold text-ink">{qrItem.code}</p>
              <p className="text-sm text-slate-500">{qrItem.productName}</p>
            </div>
            <button onClick={printQr} className="btn-primary w-full mt-6">
              <Printer className="h-4 w-4" /> Chop etish
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!actionItem} onClose={() => setActionItem(null)} title="Namunani harakatlantirish" size="sm">
        {actionItem && (
          <div>
            <p className="font-mono text-primary font-bold">{actionItem.code}</p>
            <p className="font-semibold text-ink">{actionItem.productName}</p>
            <p className="text-sm text-slate-500 mt-1">
              Holat: <span className="font-medium text-ink">{STATUS_LABELS[actionItem.status]}</span> —{' '}
              Hozirgi joyi: <span className="font-medium text-ink">{actionItem.currentLab?.nameUz || '—'}</span>
            </p>

            <div className="mt-5 space-y-4">
              {actionItem.status === 'LABORATORIYADA' && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Qaysi laboratoriyaga jo'natilmoqda?</label>
                  <Select
                    value={destLabId}
                    onChange={setDestLabId}
                    placeholder="Laboratoriyani tanlang"
                    options={labs
                      .filter((l) => l.id !== actionItem.currentLabId)
                      .map((l) => ({ value: l.id, label: l.nameUz }))}
                  />
                </div>
              )}
              {actionItem.status === 'TASHILMOQDA' && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Qaysi laboratoriya qabul qilmoqda?</label>
                  <Select
                    value={destLabId}
                    onChange={setDestLabId}
                    placeholder="Laboratoriyani tanlang"
                    options={labs.map((l) => ({ value: l.id, label: l.nameUz }))}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Izoh (ixtiyoriy)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" />
              </div>

              <div className="flex flex-wrap gap-3">
                {actionItem.status === 'LABORATORIYADA' && (
                  <>
                    <button onClick={() => doAction('CHIQARISH')} disabled={actionBusy} className="btn-primary">
                      <ArrowRightLeft className="h-4 w-4" /> Chiqarish
                    </button>
                    <button onClick={() => doAction('YAKUNLASH')} disabled={actionBusy} className="btn-secondary">
                      <CheckCircle2 className="h-4 w-4" /> Yakunlash
                    </button>
                  </>
                )}
                {actionItem.status === 'TASHILMOQDA' && (
                  <button onClick={() => doAction('QABUL_QILISH')} disabled={actionBusy} className="btn-primary">
                    <PackageCheck className="h-4 w-4" /> Qabul qilish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}