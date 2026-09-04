import React, { useEffect, useState } from 'react';
import { Eye, X, Plus, AlertTriangle, Tag } from 'lucide-react';
import { adminApplications, adminTestItems, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Select, Pagination, StatusBadge, APPLICATION_STATUSES, STATUS_LABELS } from '../../components/UI.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';

export default function AdminApplications() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const [services, setServices] = useState([]);
  const [addServiceId, setAddServiceId] = useState('');
  const [testItemBusy, setTestItemBusy] = useState(false);
  const [creatingTnVed, setCreatingTnVed] = useState(false);
  const [newTnVedName, setNewTnVedName] = useState('');
  const [savingTnVed, setSavingTnVed] = useState(false);

  const load = () => {
    setError(false);
    adminApplications
      .list({ status: status || undefined, page, pageSize: 15 })
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  useEffect(() => {
    adminResource('services')
      .list({ pageSize: 200 })
      .then((d) => setServices(d.items))
      .catch(() => setServices([]));
  }, []);

  const openDetail = (item) => {
    setSelected(item);
    setStatusDraft(item.status);
    setCommentDraft(item.statusComment || '');
    setAddServiceId('');
    setCreatingTnVed(false);
    setNewTnVedName(item.tnVedCode || item.productName || '');
    // The list row doesn't carry testItems/tnVedCodeRel — fetch the full detail.
    adminApplications.get(item.id).then(setSelected).catch(() => {});
  };

  const refreshSelected = () => adminApplications.get(selected.id).then(setSelected);

  const saveStatus = async () => {
    setSaving(true);
    try {
      await adminApplications.updateStatus(selected.id, statusDraft, commentDraft);
      showToast('Holat yangilandi.', 'success');
      setSelected(null);
      load();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addTestItem = async () => {
    if (!addServiceId) return;
    setTestItemBusy(true);
    try {
      await adminTestItems.add(selected.id, addServiceId);
      setAddServiceId('');
      await refreshSelected();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setTestItemBusy(false);
    }
  };

  const removeTestItem = async (itemId) => {
    setTestItemBusy(true);
    try {
      await adminTestItems.remove(selected.id, itemId);
      await refreshSelected();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setTestItemBusy(false);
    }
  };

  const createTnVedFromApplication = async () => {
    if (!newTnVedName.trim()) return;
    setSavingTnVed(true);
    try {
      await adminResource('tnved-codes').create({
        code: selected.tnVedCode,
        nameUz: newTnVedName.trim(),
        serviceIds: (selected.testItems || []).map((t) => t.serviceId),
      });
      showToast("TN VED yozuvi yaratildi — keyingi shu kod bilan kelgan arizalar uchun avtomatik taklif qilinadi.", 'success');
      setCreatingTnVed(false);
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSavingTnVed(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Arizalar</h1>

      <div className="max-w-xs mb-5">
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          placeholder="Barcha holatlar"
          options={APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        />
      </div>

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Raqam</th>
                <th className="px-4 py-3">Mijoz</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Tashkilot</th>
                <th className="px-4 py-3">Laboratoriya</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((a) => (
                <tr key={a.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 font-mono text-primary">{a.applicationNumber}</td>
                  <td className="px-4 py-3">{a.fullName}</td>
                  <td className="px-4 py-3">{a.phone}</td>
                  <td className="px-4 py-3">{a.organization || '—'}</td>
                  <td className="px-4 py-3">{a.service?.laboratory?.nameUz || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(a)} className="p-2 rounded-lg hover:bg-bg-light text-primary">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pageSize={15} total={data.total} onChange={setPage} />}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.applicationNumber} size="md">
        {selected && (
          <div className="space-y-4">
            <Row label="Mijoz" value={selected.fullName} />
            <Row label="Telefon" value={selected.phone} />
            <Row label="Email" value={selected.email} />
            <Row label="Mahsulot" value={selected.productName} />
            <Row label="Izoh" value={selected.comment} />
            {selected.files?.length > 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Fayllar</p>
                <div className="flex flex-wrap gap-2">
                  {selected.files.map((f) => (
                    <a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      {f.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-ink mb-2">Sinov dasturi</p>

              {selected.tnVedCodeId ? (
                <div className="flex items-center gap-2 mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    TN VED: <span className="font-mono font-semibold">{selected.tnVedCodeRel?.code}</span> — {selected.tnVedCodeRel?.nameUz}
                  </span>
                </div>
              ) : selected.tnVedCode ? (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      TN VED aniqlanmagan: <span className="font-mono font-semibold">{selected.tnVedCode}</span>
                    </span>
                  </div>
                  {selected.productDescription && (
                    <p className="text-xs text-amber-700 mt-1.5">{selected.productDescription}</p>
                  )}
                  {creatingTnVed ? (
                    <div className="mt-2.5 space-y-2">
                      <input
                        value={newTnVedName}
                        onChange={(e) => setNewTnVedName(e.target.value)}
                        placeholder="Mahsulot nomi"
                        className="input-field text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={createTnVedFromApplication}
                          disabled={savingTnVed || !newTnVedName.trim()}
                          className="btn-primary !py-1.5 !px-3 text-xs"
                        >
                          {savingTnVed ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                        <button onClick={() => setCreatingTnVed(false)} className="btn-secondary !py-1.5 !px-3 text-xs">
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingTnVed(true)}
                      className="mt-2 text-xs font-medium text-amber-800 hover:underline"
                    >
                      + Yangi TN VED yozuvi yaratish
                    </button>
                  )}
                </div>
              ) : null}

              {(selected.testItems || []).length === 0 ? (
                <p className="text-xs text-slate-400 mb-2">Hali xizmat qo'shilmagan.</p>
              ) : (
                <ul className="space-y-1.5 mb-2">
                  {selected.testItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="text-ink">{item.service?.nameUz}</span>
                      <button
                        onClick={() => removeTestItem(item.id)}
                        disabled={testItemBusy}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={addServiceId}
                    onChange={setAddServiceId}
                    placeholder="Xizmat tanlang"
                    options={services
                      .filter((s) => !(selected.testItems || []).some((t) => t.serviceId === s.id))
                      .map((s) => ({ value: s.id, label: s.nameUz }))}
                  />
                </div>
                <button
                  onClick={addTestItem}
                  disabled={!addServiceId || testItemBusy}
                  className="btn-secondary !py-2.5 !px-3 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Holat</label>
              <Select
                value={statusDraft}
                onChange={setStatusDraft}
                placeholder="—"
                options={APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Izoh (ixtiyoriy)</label>
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button onClick={saveStatus} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm border-b border-border pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ink text-right max-w-[60%]">{value}</span>
    </div>
  );
}
