import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { adminApplications } from '../../services/adminApi';
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

  const openDetail = (item) => {
    setSelected(item);
    setStatusDraft(item.status);
    setCommentDraft(item.statusComment || '');
  };

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
