import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X as XIcon } from 'lucide-react';
import { adminResource, uploadFiles } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { SearchBar, Pagination, Select } from '../../components/UI.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

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
  const [uploadingField, setUploadingField] = useState(null);
  const [asyncOptions, setAsyncOptions] = useState({});

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

  const loadAsyncOptions = () => {
    const asyncFields = config.fields.filter((f) => f.type === 'async-select');
    asyncFields.forEach((f) => {
      adminResource(f.optionsResource)
        .list({ pageSize: 200 })
        .then((d) => setAsyncOptions((prev) => ({ ...prev, [f.name]: d.items })))
        .catch(() => setAsyncOptions((prev) => ({ ...prev, [f.name]: [] })));
    });
  };

  const openCreate = () => {
    setEditing(null);
    const initial = {};
    config.fields.forEach((f) => {
      if (f.default !== undefined) initial[f.name] = f.default;
      else initial[f.name] = f.type === 'checkbox' ? false : '';
    });
    setForm(initial);
    loadAsyncOptions();
    setModalOpen(true);
  };

   const openEdit = (item) => {
    setEditing(item);
    // Only pull in the fields this form actually shows — the raw `item`
    // from the API also includes nested relation objects (e.g. `laboratory`
    // alongside `laboratoryId`), which would conflict when sent back to
    // Prisma on save.
    const initial = {};
    config.fields.forEach((f) => {
      initial[f.name] = item[f.name] ?? (f.type === 'checkbox' ? false : '');
    });
    setForm(initial);
    loadAsyncOptions();
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

  const handleMultiFileChange = async (name, fileList) => {
    if (!fileList?.length) return;
    setUploadingField(name);
    try {
      const res = await uploadFiles(fileList);
      const newUrls = res.files.map((f) => f.url);
      const existing = (form[name] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      handleChange(name, [...existing, ...newUrls].join(','));
      showToast(`${newUrls.length} ta fayl yuklandi.`, 'success');
    } catch {
      showToast('Fayl yuklashda xatolik.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const removeMultiFileUrl = (name, urlToRemove) => {
    const remaining = (form[name] || '')
      .split(',')
      .map((s) => s.trim())
      .filter((u) => u && u !== urlToRemove);
    handleChange(name, remaining.join(','));
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

      if (config.autoFillFields) {
        Object.entries(config.autoFillFields).forEach(([target, source]) => {
          if (!payload[target]) payload[target] = payload[source];
        });
      }

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
                  rows={f.rows || 3}
                  className="input-field resize-none"
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                />
              ) : f.type === 'async-select' ? (
                <div>
                  <Select
                    value={form[f.name] ?? ''}
                    onChange={(v) => handleChange(f.name, v)}
                    placeholder={
                      asyncOptions[f.name] === undefined ? 'Yuklanmoqda...' : `${f.label} tanlang`
                    }
                    options={(asyncOptions[f.name] || []).map((item) => ({
                      value: item.id,
                      label: f.optionsLabel ? f.optionsLabel(item) : item.nameUz || item.name || item.id,
                    }))}
                  />
                  {asyncOptions[f.name] && asyncOptions[f.name].length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Hozircha ro'yxat bo'sh. Avval tegishli bo'limda yozuv yarating.
                    </p>
                  )}
                </div>
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
              ) : f.type === 'multi-file' ? (
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleMultiFileChange(f.name, e.target.files)}
                    className="text-sm"
                  />
                  {uploadingField === f.name && (
                    <p className="text-xs text-primary mt-1">Yuklanmoqda...</p>
                  )}
                  {(form[f.name] || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(form[f.name] || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((url) => (
                          <div key={url} className="relative group">
                            <img
                              src={url}
                              alt=""
                              className="h-16 w-16 object-cover rounded-lg border border-border"
                            />
                            <button
                              type="button"
                              onClick={() => removeMultiFileUrl(f.name, url)}
                              className="absolute -top-2 -right-2 bg-white border border-border rounded-full p-0.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
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