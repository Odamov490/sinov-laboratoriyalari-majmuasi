import React, { useEffect, useState } from 'react';
import {
  Plus,
  Printer,
  ChevronDown,
  ChevronUp,
  QrCode,
  Eye,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { adminSamples, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select, SearchBar, Pagination } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate } from '../../utils/localize';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SampleStatusBadge from '../../components/samples/SampleStatusBadge.jsx';
import QuickTransferMenu from '../../components/samples/QuickTransferMenu.jsx';
import RowActionsMenu from '../../components/samples/RowActionsMenu.jsx';
import PendingReceiptsPanel from '../../components/samples/PendingReceiptsPanel.jsx';
import { STATUS_OPTIONS, isOverdue } from '../../components/samples/sampleConstants';

const PAGE_SIZE = 20;

export default function AdminSamples() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [labs, setLabs] = useState([]);
  const [pending, setPending] = useState([]);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ productName: '', description: '', originLabId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const [qrItem, setQrItem] = useState(null);

  const [busyId, setBusyId] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const load = () => {
    setError(false);
    adminSamples
      .list({ q: q || undefined, status: status || undefined, page, pageSize: PAGE_SIZE })
      .then(setData)
      .catch(() => setError(true));
  };

  const loadPending = () => {
    adminSamples
      .list({ status: 'TASHILMOQDA', pageSize: 100 })
      .then((d) => setPending(d.items))
      .catch(() => {});
  };

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page]);

  useEffect(() => {
    loadPending();
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  useEffect(() => {
    if (statsOpen && !stats) {
      adminSamples.stats().then(setStats).catch(() => {});
    }
  }, [statsOpen, stats]);

  const flash = (id) => {
    setFlashId(id);
    setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1600);
  };

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

  const sendSample = async (sample, toLabId) => {
    setBusyId(sample.id);
    try {
      await adminSamples.action(sample.id, { action: 'CHIQARISH', toLabId });
      showToast(`${sample.code} yuborildi.`, 'success');
      flash(sample.id);
      load();
      loadPending();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const finishSample = async (sample) => {
    setBusyId(sample.id);
    try {
      await adminSamples.action(sample.id, { action: 'YAKUNLASH' });
      showToast(`${sample.code} yakunlandi.`, 'success');
      flash(sample.id);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const receiveSample = async (sample, toLabId) => {
    setBusyId(sample.id);
    try {
      await adminSamples.action(sample.id, { action: 'QABUL_QILISH', toLabId });
      showToast(`${sample.code} qabul qilindi.`, 'success');
      flash(sample.id);
      load();
      loadPending();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const rowActions = (s) => {
    const menuItems = [
      { label: "QR ko'rish", icon: QrCode, onClick: () => setQrItem(s) },
      { label: 'Batafsil', icon: Eye, to: `/admin/namunalar/${s.id}` },
    ];
    if (s.status === 'LABORATORIYADA') {
      menuItems.unshift({ label: 'Yakunlash', icon: CheckCircle2, onClick: () => finishSample(s) });
    }
    return (
      <div className="flex items-center justify-end gap-1.5">
        {s.status === 'LABORATORIYADA' && (
          <QuickTransferMenu
            labs={labs}
            excludeLabId={s.currentLabId}
            busy={busyId === s.id}
            onSelect={(labId) => sendSample(s, labId)}
          />
        )}
        {s.status === 'TASHILMOQDA' && (
          <QuickTransferMenu
            labs={labs}
            busy={busyId === s.id}
            label="Qabul qilish"
            onSelect={(labId) => receiveSample(s, labId)}
          />
        )}
        <RowActionsMenu items={menuItems} />
      </div>
    );
  };

  const myLabId = user?.role === 'MANAGER' ? user.labId : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-ink">Namunalar</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Yangi namuna ro'yxatga olish
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Namunani ro'yxatga oling, QR yorliqni chop eting va namunaga yopishtiring. Boshqa laboratoriyaga
        yuborish uchun qatordagi "Yuborish" tugmasidan foydalaning — laboratoriyani tanlashingiz bilan
        darhol jo'natiladi.
      </p>

      <PendingReceiptsPanel items={pending} myLabId={myLabId} onReceive={receiveSample} busyId={busyId} />

      <div className="card mb-6">
        <button
          onClick={() => setStatsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ink"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Statistika
          </span>
          {statsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {statsOpen && (
          <div className="border-t border-border p-4">
            {!stats ? (
              <Loading />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
                  {stats.perLab.map((l) => (
                    <div key={l.labId} className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xl font-bold text-primary">{l.count}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-tight">{l.labName}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-lg border border-border p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-lg">
                      {stats.inTransitCount}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">Tashilmoqda</p>
                      <p className="text-xs text-slate-500">Hozir yo'lda bo'lgan namunalar</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4 flex items-center gap-4">
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
                  <div>
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
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-full sm:w-64">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Kod yoki mahsulot bo'yicha qidirish" />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            placeholder="Barcha holatlar"
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="card overflow-x-auto hidden md:block">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState message="Hali namuna ro'yxatga olinmagan." />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Joylashuvi</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Muddat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((s) => {
                const overdue = isOverdue(s);
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-bg-light/60 transition-colors ${overdue ? 'bg-red-50/60' : ''} ${
                      flashId === s.id ? 'flash-success' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-primary">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-ink">{s.productName}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.status === 'TASHILMOQDA' ? (
                        <span className="italic text-slate-400">Yo'lda</span>
                      ) : (
                        s.currentLab?.nameUz || s.originLab?.nameUz || '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SampleStatusBadge status={s.status} />
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
                    <td className="px-4 py-3 text-right">{rowActions(s)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="md:hidden space-y-3">
        {error ? (
          <div className="card p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <div className="card"><Loading /></div>
        ) : data.items.length === 0 ? (
          <div className="card p-10 text-center">
            <EmptyState message="Hali namuna ro'yxatga olinmagan." />
          </div>
        ) : (
          data.items.map((s) => {
            const overdue = isOverdue(s);
            return (
              <div
                key={s.id}
                className={`card p-4 transition-colors ${overdue ? 'bg-red-50/60' : ''} ${
                  flashId === s.id ? 'flash-success' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-primary font-semibold">{s.code}</p>
                    <p className="font-medium text-ink truncate">{s.productName}</p>
                  </div>
                  <SampleStatusBadge status={s.status} />
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  Joylashuvi:{' '}
                  <span className="text-ink font-medium">
                    {s.status === 'TASHILMOQDA' ? "Yo'lda" : s.currentLab?.nameUz || s.originLab?.nameUz || '—'}
                  </span>
                </p>
                {s.dueDate && (
                  <p className={`text-xs mb-3 flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                    {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                    Muddat: {formatDate(s.dueDate)}
                  </p>
                )}
                <div className="flex justify-end pt-1 border-t border-border mt-2">{rowActions(s)}</div>
              </div>
            );
          })
        )}
      </div>

      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}

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
    </div>
  );
}
