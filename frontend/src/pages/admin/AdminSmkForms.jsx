import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowLeft, Copy } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { tr } from '../../i18n/tr.js';
import { DEFAULT_HEADER, normalizeHeader, buildDocumentHtml, useFormLogo } from './smk/smkDocument.js';

// SMK formalar kutubxonasi (SUPER_ADMIN). Har bir forma — jadval: ustunlar
// (qo'shiladi, olib tashlanadi, tartiblanadi) va o'z shapkasi (logo hammasida
// bir xil). Fayl yuklanmaydi — tayyor jadval Word/PDF'ga tizimda chiqariladi.

export const FIELD_TYPES = [
  { value: 'text', label: tr('Matn') },
  { value: 'textarea', label: tr('Uzun matn') },
  { value: 'number', label: tr('Raqam') },
  { value: 'date', label: tr('Sana') },
  { value: 'select', label: tr("Ro'yxatdan tanlash") },
  { value: 'checkbox', label: tr("Ha / Yo'q") },
  { value: 'staff', label: tr('Xodim') },
];

// Ustun kaliti bir marta beriladi va o'zgarmaydi (yozuvlardagi qiymat shu
// kalit bilan saqlanadi), shuning uchun o'chirilgan ustun kaliti qayta ishlatilmaydi.
const newKey = (fields) => {
  let key;
  do key = `f${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  while (fields.some((f) => f.key === key));
  return key;
};
const emptyForm = () => ({ code: '', title: '', description: '', fields: [], header: DEFAULT_HEADER(), order: 0, isActive: true });
const PREVIEW_LAB = { nameUz: '«Laboratoriya nomi»', nameRu: '«Название лаборатории»', nameEn: '«Laboratory name»', slug: 'lab' };

export default function AdminSmkForms() {
  const { user } = useAuth();
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/sifat" replace />;
  return <FormsLibrary />;
}

function FormsLibrary() {
  const { showToast } = useToast();
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

  // Nusxa: shapka va ustunlar saqlanadi, kod/nom yangilanadi.
  const duplicate = (f) =>
    setEditing({
      ...emptyForm(),
      ...f,
      id: undefined,
      entryCount: 0,
      code: `${f.code}-2`,
      title: `${f.title} (${tr('nusxa')})`,
      fields: (f.fields || []).map((x) => ({ ...x })),
    });

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
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{tr('Kod')}</th>
                <th className="px-4 py-3">{tr('Nomi')}</th>
                <th className="px-4 py-3">{tr('Ustunlar')}</th>
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
                  <td className="max-w-[360px] px-4 py-3 text-ink">{f.title}</td>
                  <td className="px-4 py-3">{(f.fields || []).length}</td>
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
                    <div className="flex justify-end gap-1">
                      <button onClick={() => duplicate(f)} className="rounded-lg p-2 text-slate-500 hover:bg-bg-light" title={tr('Nusxa olish')}>
                        <Copy className="h-4 w-4" />
                      </button>
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
        message={
          confirmDelete?.entryCount > 0
            ? tr(
                "\"{0}\" formasi va uning {1} ta to'ldirilgan yozuvi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi. Davom etasizmi?",
                `${confirmDelete.code} ${confirmDelete.title}`,
                confirmDelete.entryCount
              )
            : tr('"{0}" formasini o\'chirasizmi?', confirmDelete ? `${confirmDelete.code} ${confirmDelete.title}` : '')
        }
      />
    </div>
  );
}

// Matn qatorlari ro'yxati (qo'shish / o'chirish / tartiblash) uchun yordamchilar.
const moveIn = (list, i, d) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

function IconBtn({ onClick, disabled, title, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded p-1.5 hover:bg-white disabled:opacity-30 ${danger ? 'text-red-500' : 'text-slate-500'}`}
    >
      {children}
    </button>
  );
}

function FormEditor({ initial, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => ({
    ...initial,
    description: initial.description || '',
    header: normalizeHeader(initial.header),
    fields: (initial.fields || []).map((f) => ({ ...f, optionsText: (f.options || []).join('\n') })),
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setHeader = (patch) => setForm((p) => ({ ...p, header: { ...p.header, ...patch } }));
  const setField = (i, patch) => setForm((p) => ({ ...p, fields: p.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const addField = () =>
    setForm((p) => ({ ...p, fields: [...p.fields, { key: newKey(p.fields), label: '', type: 'text', required: false, optionsText: '' }] }));

  const { orgLines, meta, orientation } = form.header;
  const logoSrc = useFormLogo();

  // Jonli ko'rinish: shapka + ustun sarlavhalari + 2 ta bo'sh qator.
  const previewHtml = useMemo(
    () =>
      buildDocumentHtml({
        form: { ...form, title: form.title || tr('Forma nomi'), fields: form.fields.map((f) => ({ ...f, label: f.label || '…' })) },
        lab: PREVIEW_LAB,
        rows: [],
        blankRows: 2,
        logoSrc,
      }).html,
    [form, logoSrc]
  );

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        description: form.description,
        header: form.header,
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
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Tavsif / ko\'rsatma')}</label>
          <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} />
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

      {/* --- Shapka --- */}
      <section className="mt-6 rounded-xl border border-border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-ink">{tr('Shapka')}</h4>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">{tr('Sahifa')}:</span>
            <select className="input-field !w-auto !py-1.5" value={orientation} onChange={(e) => setHeader({ orientation: e.target.value })}>
              <option value="landscape">{tr('Albom (yotiq)')}</option>
              <option value="portrait">{tr('Kitob (tik)')}</option>
            </select>
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          {tr('Logo hamma formalarda bir xil. Matnda {laboratoriya}, {kod}, {sana} yozsangiz, hujjatda avtomatik almashtiriladi.')}
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">{tr('Markaziy qatorlar (forma nomidan yuqorida)')}</p>
            <div className="space-y-2">
              {orgLines.map((line, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    className="input-field !py-2"
                    value={line}
                    onChange={(e) => setHeader({ orgLines: orgLines.map((l, j) => (j === i ? e.target.value : l)) })}
                  />
                  <IconBtn onClick={() => setHeader({ orgLines: moveIn(orgLines, i, -1) })} disabled={i === 0}><ArrowUp className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => setHeader({ orgLines: moveIn(orgLines, i, 1) })} disabled={i === orgLines.length - 1}><ArrowDown className="h-4 w-4" /></IconBtn>
                  <IconBtn danger onClick={() => setHeader({ orgLines: orgLines.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              ))}
              {orgLines.length < 6 && (
                <button type="button" onClick={() => setHeader({ orgLines: [...orgLines, ''] })} className="text-sm font-medium text-primary hover:underline">
                  + {tr("Qator qo'shish")}
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">{tr("O'ng tomondagi rekvizitlar")}</p>
            <div className="space-y-2">
              {meta.map((m, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    className="input-field !w-2/5 !py-2"
                    placeholder={tr('Nomi')}
                    value={m.label}
                    onChange={(e) => setHeader({ meta: meta.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  />
                  <input
                    className="input-field !py-2"
                    placeholder={tr('Qiymati')}
                    value={m.value}
                    onChange={(e) => setHeader({ meta: meta.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })}
                  />
                  <IconBtn onClick={() => setHeader({ meta: moveIn(meta, i, -1) })} disabled={i === 0}><ArrowUp className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => setHeader({ meta: moveIn(meta, i, 1) })} disabled={i === meta.length - 1}><ArrowDown className="h-4 w-4" /></IconBtn>
                  <IconBtn danger onClick={() => setHeader({ meta: meta.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              ))}
              {meta.length < 8 && (
                <button type="button" onClick={() => setHeader({ meta: [...meta, { label: '', value: '' }] })} className="text-sm font-medium text-primary hover:underline">
                  + {tr("Rekvizit qo'shish")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Ustunlar --- */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-ink">{tr('Ustunlar')} ({form.fields.length})</h4>
          <button type="button" onClick={addField} className="btn-secondary !py-2 text-sm">
            <Plus className="h-4 w-4" /> {tr("Ustun qo'shish")}
          </button>
        </div>
        {form.fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-slate-400">
            {tr("Hali ustun yo'q. Jadval ustunlarini qo'shing.")}
          </p>
        )}
        <div className="space-y-2">
          {form.fields.map((f, i) => (
            <div key={f.key} className="rounded-lg border border-border bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-xs font-semibold text-slate-400">{i + 1}.</span>
                <input
                  className="input-field !w-auto min-w-[200px] flex-1 !py-2"
                  placeholder={tr('Ustun nomi')}
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
                  <IconBtn onClick={() => set('fields', moveIn(form.fields, i, -1))} disabled={i === 0}><ArrowUp className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => set('fields', moveIn(form.fields, i, 1))} disabled={i === form.fields.length - 1}><ArrowDown className="h-4 w-4" /></IconBtn>
                  <IconBtn danger onClick={() => set('fields', form.fields.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconBtn>
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
            {tr("Bu formada yozuvlar bor: ustun o'chirilsa yoki turi o'zgarsa, eski yozuvlardagi shu qiymat keyingi saqlashda yo'qoladi.")}
          </p>
        )}
      </section>

      {/* --- Ko'rinish --- */}
      <section className="mt-6">
        <h4 className="mb-2 font-semibold text-ink">{tr("Hujjat ko'rinishi")}</h4>
        <div className="overflow-x-auto rounded-lg border border-border bg-white p-4">
          <div
            data-testid="smk-preview"
            className="min-w-[640px] text-black"
            // HTML smkDocument.buildDocumentHtml ichida esc() bilan tozalangan.
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </section>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">{tr('Bekor qilish')}</button>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </Modal>
  );
}
