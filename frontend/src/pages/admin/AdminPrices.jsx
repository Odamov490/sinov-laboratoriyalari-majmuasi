import React, { useEffect, useState } from 'react';
import { Plus, History } from 'lucide-react';
import { adminPrices, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';

export default function AdminPrices() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [labs, setLabs] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [form, setForm] = useState({ nameUz: '', laboratoryId: '', amount: '' });

  const load = () => {
    setError(false);
    adminPrices.list().then(setData).catch(() => setError(true));
  };

  useEffect(() => {
    load();
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  const openCreate = () => {
    setEditingPrice(null);
    setForm({ nameUz: '', laboratoryId: '', amount: '' });
    setModalOpen(true);
  };

  const openEdit = (price) => {
    setEditingPrice(price);
    setForm({
      nameUz: price.service?.nameUz || '',
      laboratoryId: price.service?.laboratory?.id || '',
      amount: price.amount ?? '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.nameUz || !form.laboratoryId) {
      showToast('Nomi va laboratoriyani tanlang.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingPrice) {
        await adminPrices.update(editingPrice.id, {
          nameUz: form.nameUz,
          laboratoryId: form.laboratoryId,
          amount: form.amount === '' ? null : Number(form.amount),
        });
        showToast('Yangilandi. Eski narx tarixga saqlandi.', 'success');
      } else {
        await adminPrices.create({
          nameUz: form.nameUz,
          laboratoryId: form.laboratoryId,
          amount: form.amount === '' ? null : Number(form.amount),
        });
        showToast("Qo'shildi.", 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-ink">Narxlar</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Qo'shish
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Nomi, laboratoriya va narxni kiriting — saqlash. Eski narxlar tarixga avtomatik saqlanadi va
        o'chirilmaydi.
      </p>

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState message="Hali narx qo'shilmagan. Yuqoridagi 'Qo'shish' tugmasini bosing." />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Laboratoriya</th>
                <th className="px-4 py-3">Narx</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 font-medium text-ink">{p.service?.nameUz}</td>
                  <td className="px-4 py-3">{p.service?.laboratory?.nameUz}</td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {p.amount ? `${Number(p.amount).toLocaleString('uz-UZ')} ${p.currency}` : "Ma'lumot yangilanmoqda"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    {p.history?.length > 0 && (
                      <button onClick={() => setHistoryItem(p)} className="p-2 rounded-lg hover:bg-bg-light text-slate-500" title="Tarix">
                        <History className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => openEdit(p)} className="text-sm font-medium text-primary">
                      Tahrirlash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingPrice ? 'Tahrirlash' : "Qo'shish"} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Nomi</label>
            <input
              type="text"
              value={form.nameUz}
              onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
              placeholder="Masalan: Avtomobil akkumlyatorlari"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Laboratoriya</label>
            <Select
              value={form.laboratoryId}
              onChange={(v) => setForm({ ...form, laboratoryId: v })}
              placeholder="Laboratoriyani tanlang"
              options={labs.map((l) => ({ value: l.id, label: l.nameUz }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Narx (UZS)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Masalan: 250000"
              className="input-field"
            />
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <Modal open={!!historyItem} onClose={() => setHistoryItem(null)} title="Narxlar tarixi" size="sm">
        <ul className="space-y-2">
          {historyItem?.history?.map((h) => (
            <li key={h.id} className="flex justify-between text-sm border-b border-border pb-2">
              <span className="text-slate-500">{formatDate(h.changedAt)}</span>
              <span className="font-medium text-ink">
                {h.amount ? `${Number(h.amount).toLocaleString('uz-UZ')} ${h.currency}` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}