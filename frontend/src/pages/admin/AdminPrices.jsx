import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { adminPrices } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';

export default function AdminPrices() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);

  const load = () => {
    setError(false);
    adminPrices.list().then(setData).catch(() => setError(true));
  };

  useEffect(load, []);

  const openEdit = (price) => {
    setEditing(price);
    setAmount(price.amount ?? '');
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminPrices.update(editing.id, { amount: amount === '' ? null : Number(amount) });
      showToast('Narx yangilandi. Eski narx tarixga saqlandi.', 'success');
      setEditing(null);
      load();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">Narxlar</h1>
      <p className="text-sm text-slate-500 mb-6">Eski narxlar avtomatik ravishda tarixga saqlanadi va o'chirilmaydi.</p>

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Xizmat</th>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Narxni tahrirlash" size="sm">
        <label className="block text-sm font-medium text-ink mb-1.5">Narx (UZS)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
        <button onClick={save} disabled={saving} className="btn-primary w-full mt-6">
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
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