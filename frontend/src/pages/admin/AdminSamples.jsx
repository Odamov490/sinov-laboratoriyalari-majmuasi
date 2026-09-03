import React, { useEffect, useState } from 'react';
import { Plus, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { adminSamples, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';

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

export default function AdminSamples() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [labs, setLabs] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ productName: '', description: '', originLabId: '' });
  const [saving, setSaving] = useState(false);

  const [qrItem, setQrItem] = useState(null);

  const load = () => {
    setError(false);
    adminSamples.list({ pageSize: 100 }).then(setData).catch(() => setError(true));
  };

  useEffect(() => {
    load();
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  const openCreate = () => {
    setForm({ productName: '', description: '', originLabId: '' });
    setCreateOpen(true);
  };

  const createSample = async () => {
    if (!form.productName || !form.originLabId) {
      showToast('Mahsulot nomi va laboratoriyani kiriting.', 'error');
      return;
    }
    setSaving(true);
    try {
      const sample = await adminSamples.create(form);
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-ink">Namunalar</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Yangi namuna ro'yxatga olish
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Namunani ro'yxatga oling, QR yorliqni chop eting va namunaga yopishtiring. Namunani
        laboratoriyalar orasida ko'chirish uchun "Skanerlash" bo'limidan foydalaning.
      </p>

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
          <table className="w-full text-sm min-w-[850px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Kelib chiqishi</th>
                <th className="px-4 py-3">Hozirgi joyi</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3 text-right">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((s) => (
                <tr key={s.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 font-mono text-primary">{s.code}</td>
                  <td className="px-4 py-3 font-medium text-ink">{s.productName}</td>
                  <td className="px-4 py-3 text-slate-600">{s.originLab?.nameUz}</td>
                  <td className="px-4 py-3 text-slate-600">{s.currentLab?.nameUz || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setQrItem(s)} className="text-sm font-medium text-primary hover:underline">
                      QR ko'rish
                    </button>
                  </td>
                </tr>
              ))}
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