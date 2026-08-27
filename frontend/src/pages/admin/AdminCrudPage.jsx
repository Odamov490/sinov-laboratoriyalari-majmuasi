import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminResource, uploadFiles } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { SearchBar, Pagination } from '../../components/UI.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * config = {
 *   path: 'laboratories',
 *   title: 'Laboratoriyalar',
 *   columns: [{ key: 'nameUz', label: 'Nomi' }, ...],
 *   fields: [{ name: 'nameUz', label: 'Nomi (UZ)', type: 'text', required: true }, ...],
 *   searchable: true,
 * }
 */
export default function AdminCrudPage({ config }) {
  const resource = adminResource(config.path);
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setError(false);
    resource
      .list({ q: q || undefined, page, pageSize: 15 })
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    setData(null);
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const openCreate = () => {
    setEditing(null);
    const initial = {};
    config.fields.forEach((f) => (initial[f.name] = f.type === 'checkbox' ? false : ''));
    setForm(initial);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleFileChange = async (name, fileList) => {
    if (!fileList?.length) return;
    try {
      const res = await uploadFiles(fileList);
      handleChange(name, res.files[0].url);
    } catch {
      showToast('Fayl yuklashda xatolik.', 'error');
    }
  };

 const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      config.fields.forEach((f) => {
        if (f.type === 'number' && payload[f.name] !== '') payload[f.name] = Number(payload[f.name]);
        if (f.type === 'select-bool') payload[f.name] = payload[f.name] === 'true' || payload[f.name] === true;
        if (f.name.endsWith('Id') && payload[f.name] === '') payload[f.name] = null;
      });
      if (editing) {
        await resource.update(editing.id, payload);
        showToast('Yangilandi.', 'success');
      } else {
        await resource.create(payload);
        showToast('Yaratildi.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await resource.remove(id);
      showToast("O'chirildi.", 'success');
      load();
    } catch {
      showToast("O'chirishda xatolik.", 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-ink">{config.title}</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Qo'shish
        </button>
      </div>

      {config.searchable !== false && (
        <div className="max-w-sm mb-5">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        </div>
      )}

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                {config.columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-bg-light/60">
                  {config.columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-ink max-w-[240px] truncate">
                      {c.render ? c.render(item) : String(item[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-bg-light text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pageSize={15} total={data.total} onChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Tahrirlash' : "Qo'shish"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.fields.map((f) => (
            <div key={f.name} className={f.fullWidth ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-ink mb-1.5">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                />
              ) : f.type === 'select' ? (
                <select
                  className="input-field"
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                >
                  <option value="">—</option>
                  {(f.options || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={!!form[f.name]}
                  onChange={(e) => handleChange(f.name, e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary"
                />
              ) : f.type === 'file' ? (
                <div>
                  <input type="file" onChange={(e) => handleFileChange(f.name, e.target.files)} className="text-sm" />
                  {form[f.name] && <p className="text-xs text-slate-400 mt-1 truncate">{form[f.name]}</p>}
                </div>
              ) : (
                <input
                  type={f.type || 'text'}
                  className="input-field"
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Bekor qilish</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        message="Ushbu yozuvni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
      />
    </div>
  );
}
