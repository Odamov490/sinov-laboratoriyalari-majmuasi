import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X as XIcon, Download, ArrowLeft, FilePen } from 'lucide-react';
import { canOpenOnline, useOnlyOfficeStatus, ONLINE_DISABLED_MSG } from './AdminSmkTemplateEditor.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk, uploadFiles } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { tr } from '../../i18n/tr.js';

// SMK formalar kutubxonasi (SUPER_ADMIN): forma = kod, nom, maydonlar ro'yxati
// (tizimda to'ldirish uchun) va ixtiyoriy asl shablon fayli (yuklab olish uchun).

export const FIELD_TYPES = [
  { value: 'text', label: tr('Matn') },
  { value: 'textarea', label: tr('Uzun matn') },
  { value: 'number', label: tr('Raqam') },
  { value: 'date', label: tr('Sana') },
  { value: 'select', label: tr("Ro'yxatdan tanlash") },
  { value: 'checkbox', label: tr("Ha / Yo'q") },
  { value: 'staff', label: tr('Xodim') },
  { value: 'file', label: tr('Fayl') },
];
const TYPE_LABEL = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label]));
const TEMPLATE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx';

// Maydon kaliti bir marta beriladi va o'zgarmaydi (yozuvlardagi qiymat shu
// kalit bilan saqlanadi), shuning uchun o'chirilgan maydon kaliti qayta ishlatilmaydi.
const newKey = (fields) => {
  let key;
  do key = `f${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  while (fields.some((f) => f.key === key));
  return key;
};
const emptyForm = () => ({ code: '', title: '', description: '', fields: [], templateUrl: '', templateName: '', order: 0, isActive: true });

export default function AdminSmkForms() {
  const { user } = useAuth();
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/sifat" replace />;
  return <FormsLibrary />;
}

function FormsLibrary() {
  const { showToast } = useToast();
  const office = useOnlyOfficeStatus();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // {id?, ...form}
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    setError(false);
    adminSmk
      .listForms()
      .then((d) => setItems(d.items || []))
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (items || []).filter((f) => !q || `${f.code} ${f.title}`.toLowerCase().includes(q)), [items, q]);

  const remove = async (id) => {
    try {
      await adminSmk.removeForm(id);
      showToast(tr("O'chirildi."), 'success');
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    }
  };

  if (error) return <ErrorState onRetry={load} />;
  if (items === null) return <Loading />;

  return (
    <div>
      <Link to="/admin/sifat" className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {tr('Sifat menejmenti: laboratoriyalar')}
      </Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{tr('Formalar kutubxonasi')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tr('Bu yerda yaratilgan formalarni har bir laboratoriya Sifat bo\'limida o\'ziga tanlab oladi.')}
          </p>
        </div>
        <button onClick={() => setEditing(emptyForm())} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> {tr('Yangi forma')}
        </button>
      </div>

      {office && !office.available && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{ONLINE_DISABLED_MSG()}</p>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tr('Forma qidirish')}
        className="input-field mb-4 !w-full sm:!w-80"
      />

      <div className="card overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState message={tr("Formalar kutubxonasi hozircha bo'sh.")} />
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{tr('Kod')}</th>
                <th className="px-4 py-3">{tr('Nomi')}</th>
                <th className="px-4 py-3">{tr('Maydonlar')}</th>
                <th className="px-4 py-3">{tr('Shablon')}</th>
                <th className="px-4 py-3">{tr('Laboratoriyalar')}</th>
                <th className="px-4 py-3">{tr('Yozuvlar')}</th>
                <th className="px-4 py-3">{tr('Holati')}</th>
                <th className="px-4 py-3 text-right">{tr('Amallar')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((f) => (
                <tr key={f.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 font-semibold text-slate-600">{f.code}</td>
                  <td className="max-w-[320px] px-4 py-3 text-ink">{f.title}</td>
                  <td className="px-4 py-3">{(f.fields || []).length}</td>
                  <td className="px-4 py-3">
                    {f.templateUrl ? (
                      <span className="flex flex-wrap items-center gap-3">
                        {canOpenOnline(f.templateUrl) &&
                          (office?.available ? (
                            <Link to={`/admin/sifat/shablon/${f.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                              <FilePen className="h-3.5 w-3.5" /> {tr('Ochish')}
                            </Link>
                          ) : (
                            <span
                              aria-disabled="true"
                              title={ONLINE_DISABLED_MSG()}
                              className="inline-flex cursor-not-allowed items-center gap-1 text-slate-300"
                            >
                              <FilePen className="h-3.5 w-3.5" /> {tr('Ochish')}
                            </span>
                          ))}
                        <a href={f.templateUrl} download={f.templateName || undefined} className="inline-flex items-center gap-1 text-slate-500 hover:text-primary hover:underline">
                          <Download className="h-3.5 w-3.5" /> {tr('Yuklab olish')}
                        </a>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{f.labCount}</td>
                  <td className="px-4 py-3">{f.entryCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        f.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {f.isActive ? tr('Faol') : tr('Nofaol')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing({ ...emptyForm(), ...f })} className="rounded-lg p-2 text-primary hover:bg-bg-light" title={tr('Tahrirlash')}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(f)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title={tr("O'chirish")}>
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

      {editing && (
        <FormEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete.id)}
        message={tr('"{0}" formasini o\'chirasizmi?', confirmDelete ? `${confirmDelete.code} ${confirmDelete.title}` : '')}
      />
    </div>
  );
}

function FormEditor({ initial, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => ({
    ...initial,
    description: initial.description || '',
    templateUrl: initial.templateUrl || '',
    templateName: initial.templateName || '',
    fields: (initial.fields || []).map((f) => ({ ...f, optionsText: (f.options || []).join('\n') })),
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setField = (i, patch) => setForm((p) => ({ ...p, fields: p.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const addField = () =>
    setForm((p) => ({ ...p, fields: [...p.fields, { key: newKey(p.fields), label: '', type: 'text', required: false, optionsText: '' }] }));
  const removeField = (i) => setForm((p) => ({ ...p, fields: p.fields.filter((_, j) => j !== i) }));
  const moveField = (i, d) =>
    setForm((p) => {
      const fields = [...p.fields];
      const j = i + d;
      if (j < 0 || j >= fields.length) return p;
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...p, fields };
    });

  const uploadTemplate = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const res = await uploadFiles(files);
      setForm((p) => ({ ...p, templateUrl: res.files[0].url, templateName: res.files[0].originalName || '' }));
      showToast(tr('Fayl yuklandi.'), 'success');
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Fayl yuklashda xatolik.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        description: form.description,
        templateUrl: form.templateUrl,
        templateName: form.templateName,
        order: Number(form.order) || 0,
        isActive: form.isActive,
        fields: form.fields.map(({ optionsText, ...f }) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: !!f.required,
          ...(f.type === 'select' ? { options: optionsText.split('\n').map((s) => s.trim()).filter(Boolean) } : {}),
        })),
      };
      if (initial.id) await adminSmk.updateForm(initial.id, payload);
      else await adminSmk.createForm(payload);
      showToast(tr('Saqlandi.'), 'success');
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={initial.id ? tr('Formani tahrirlash') : tr('Yangi forma')} size="xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Kod')} *</label>
          <input className="input-field" placeholder="F-01" value={form.code} onChange={(e) => set('code', e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Nomi')} *</label>
          <input className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="sm:col-span-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Tavsif / ko\'rsatma')}</label>
          <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Asl shablon fayli (Word/Excel/PDF)')}</label>
          <input type="file" accept={TEMPLATE_ACCEPT} onChange={(e) => uploadTemplate(e.target.files)} className="text-sm" />
          {uploading && <p className="mt-1 text-xs text-primary">{tr('Yuklanmoqda, biroz kuting...')}</p>}
          {form.templateUrl && !uploading && (
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <a href={form.templateUrl} download={form.templateName || undefined} className="truncate text-primary hover:underline">
                {form.templateName || form.templateUrl}
              </a>
              <button type="button" onClick={() => setForm((p) => ({ ...p, templateUrl: '', templateName: '' }))} className="text-red-500">
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Tartib raqami')}</label>
          <input type="number" className="input-field" value={form.order} onChange={(e) => set('order', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-ink">
          <input type="checkbox" checked={!!form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
          {tr('Faol')}
        </label>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-ink">{tr('Maydonlar')} ({form.fields.length})</h4>
          <button type="button" onClick={addField} className="btn-secondary !py-2 text-sm">
            <Plus className="h-4 w-4" /> {tr('Maydon qo\'shish')}
          </button>
        </div>
        {form.fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-slate-400">
            {tr("Hali maydon yo'q. Forma tizimda to'ldirilishi uchun maydon qo'shing.")}
          </p>
        )}
        <div className="space-y-2">
          {form.fields.map((f, i) => (
            <div key={f.key} className="rounded-lg border border-border bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-xs font-semibold text-slate-400">{i + 1}.</span>
                <input
                  className="input-field !w-auto min-w-[200px] flex-1 !py-2"
                  placeholder={tr('Maydon nomi')}
                  value={f.label}
                  onChange={(e) => setField(i, { label: e.target.value })}
                />
                <select className="input-field !w-auto !py-2" value={f.type} onChange={(e) => setField(i, { type: e.target.value })}>
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!f.required}
                    onChange={(e) => setField(i, { required: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  {tr('Majburiy')}
                </label>
                <div className="ml-auto flex items-center">
                  <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-500 hover:bg-white disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveField(i, 1)} disabled={i === form.fields.length - 1} className="rounded p-1.5 text-slate-500 hover:bg-white disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeField(i)} className="rounded p-1.5 text-red-500 hover:bg-white">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {f.type === 'select' && (
                <textarea
                  rows={3}
                  className="input-field mt-2 resize-y text-sm"
                  placeholder={tr('Variantlar — har biri yangi qatorda')}
                  value={f.optionsText}
                  onChange={(e) => setField(i, { optionsText: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        {initial.id && initial.entryCount > 0 && (
          <p className="mt-2 text-xs text-amber-600">
            {tr("Bu formada yozuvlar bor: maydon o'chirilsa yoki turi o'zgarsa, eski yozuvlardagi shu qiymat keyingi saqlashda yo'qoladi.")}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">{tr('Bekor qilish')}</button>
        <button onClick={save} disabled={saving || uploading} className="btn-primary">
          {uploading ? tr('Fayl yuklanmoqda...') : saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </Modal>
  );
}

export { TYPE_LABEL };
