import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowLeft, X, Save, Eye, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold,
  IndentIncrease, Columns2, PanelLeft, PanelRight, RectangleHorizontal, Table2, Settings2, LayoutTemplate, Heading, Pilcrow,
  Signature, Stamp, Sigma, ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { ConfirmDialog } from '../../components/Modal.jsx';
import { tr } from '../../i18n/tr.js';
import { DEFAULT_HEADER, normalizeHeader, buildDocumentHtml, useFormLogo, BLOCK_PRESETS } from './smk/smkDocument.js';

// SMK formalar kutubxonasi (SUPER_ADMIN). Har bir forma — jadval: ustunlar
// (qo'shiladi, olib tashlanadi, tartiblanadi) va o'z shapkasi (logo hammasida
// bir xil). Fayl yuklanmaydi — tayyor jadval Word/PDF'ga tizimda chiqariladi.

export const FIELD_TYPES = [
  { value: 'text', label: tr('Matn') },
  { value: 'textarea', label: tr('Uzun matn') },
  { value: 'number', label: tr('Raqam') },
  { value: 'money', label: tr('Pul (summa)') },
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

// Kichik segment tugmalar guruhi (tanlov). data-value — joriy qiymat.
function Segmented({ value, onChange, options, testId }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-border bg-white p-0.5" data-testid={testId} data-value={value}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
            value === o.value ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {o.icon && <o.icon className="h-3.5 w-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Bosib yoqiladigan belgi tugmasi (Qalin, Xatboshi, Katta shrift).
function ToggleBtn({ on, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border px-1.5 text-xs font-semibold transition ${
        on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

// Yoqish/o'chirish (switch) — haqiqiy checkbox, ko'rinishi almashtirilgan.
function Switch({ checked, onChange, label, testId }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink" data-testid={testId}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:shadow before:transition before:content-[''] checked:bg-primary checked:before:translate-x-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/40"
      />
      {label}
    </label>
  );
}

function Card({ title, hint, action, children, testId }) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm" data-testid={testId}>
      {(title || action) && (
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          {action}
        </div>
      )}
      {hint && <p className="mb-3 text-xs leading-relaxed text-slate-400">{hint}</p>}
      {children}
    </section>
  );
}

const AddLink = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/5"
  >
    <Plus className="h-4 w-4" /> {children}
  </button>
);

// Hujjat ko'rinishi — A4 varaq, oyna eniga moslab kichraytiriladi.
function PaperPreview({ html, orientation }) {
  const wrapRef = useRef(null);
  const pageRef = useRef(null);
  const contentW = orientation === 'landscape' ? 1100 : 760;
  const pageW = contentW + 64;
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setScale(Math.min(1, wrapRef.current.clientWidth / pageW));
      if (pageRef.current) setHeight(pageRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (pageRef.current) ro.observe(pageRef.current);
    return () => ro.disconnect();
  }, [pageW]);
  return (
    <div ref={wrapRef} className="w-full">
      <div className="mx-auto" style={{ width: pageW * scale, height: height * scale }}>
        <div
          ref={pageRef}
          className="origin-top-left bg-white shadow-xl ring-1 ring-black/5"
          style={{
            width: pageW,
            padding: 32,
            minHeight: orientation === 'landscape' ? pageW / 1.414 : pageW * 1.414,
            transform: `scale(${scale})`,
          }}
        >
          <div
            data-testid="smk-preview"
            className="text-black"
            // HTML smkDocument.buildDocumentHtml ichida esc() bilan tozalangan.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">{Math.round(scale * 100)}%</p>
    </div>
  );
}

const PRESET_ICONS = { approve: Stamp, agreeApprove: Columns2, title: Heading, paragraph: Pilcrow, signatures: Signature };

function FormEditor({ initial, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => ({
    ...initial,
    description: initial.description || '',
    header: normalizeHeader(initial.header),
    fields: (initial.fields || []).map((f) => ({ ...f, optionsText: (f.options || []).join('\n') })),
  }));
  const [tab, setTab] = useState('header');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setHeader = (patch) => setForm((p) => ({ ...p, header: { ...p.header, ...patch } }));
  const setField = (i, patch) => setForm((p) => ({ ...p, fields: p.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const addField = () =>
    setForm((p) => ({ ...p, fields: [...p.fields, { key: newKey(p.fields), label: '', type: 'text', required: false, optionsText: '' }] }));

  const { orgLines, meta, orientation } = form.header;
  const blocks = form.header.blocks || [];
  const setBlocks = (next) => setHeader({ blocks: next });
  const setBlock = (i, patch) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const footer = form.header.footer || [];
  const setFooter = (next) => setHeader({ footer: next });
  const setFooterRow = (i, patch) => setFooter(footer.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const numericFields = form.fields.filter((f) => f.type === 'number' || f.type === 'money');
  const hasTable = form.header.table !== false;
  const logo = useFormLogo();

  // Esc — oynani yopish.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Jonli ko'rinish: shapka + ustun sarlavhalari + 2 ta bo'sh qator.
  const previewHtml = useMemo(
    () =>
      buildDocumentHtml({
        form: { ...form, title: form.title || tr('Forma nomi'), fields: form.fields.map((f) => ({ ...f, label: f.label || '…' })) },
        lab: PREVIEW_LAB,
        rows: [],
        blankRows: 2,
        logo,
      }).html,
    [form, logo]
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

  const tabs = [
    { key: 'header', label: tr('Shapka'), icon: LayoutTemplate },
    { key: 'blocks', label: tr('Matn bloklari'), icon: Pilcrow, count: blocks.length },
    { key: 'table', label: tr('Jadval'), icon: Table2, count: hasTable ? form.fields.length : null },
    { key: 'settings', label: tr('Sozlamalar'), icon: Settings2 },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-100" role="dialog" aria-modal="true" aria-label={initial.id ? tr('Formani tahrirlash') : tr('Yangi forma')}>
      {/* --- Yuqori panel: kod, nomi, saqlash (doim ko'rinadi) --- */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-white px-4 py-3 shadow-sm">
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title={tr('Bekor qilish')}>
          <X className="h-5 w-5" />
        </button>
        <div className="hidden text-sm font-semibold text-ink xl:block">{initial.id ? tr('Formani tahrirlash') : tr('Yangi forma')}</div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input
            className="input-field !w-40 !py-2 font-semibold"
            placeholder="F-01"
            aria-label={tr('Kod')}
            title={tr('Kod')}
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
          />
          <input
            className="input-field !py-2 min-w-[220px] flex-1"
            placeholder={`${tr('Nomi')} *`}
            aria-label={tr('Nomi')}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-secondary !py-2">{tr('Bekor qilish')}</button>
          <button onClick={save} disabled={saving} className="btn-primary !py-2">
            <Save className="h-4 w-4" /> {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* --- Chap: tahrirlash (tablar) --- */}
        <div className="flex w-full flex-col border-border bg-slate-50 lg:w-[46%] lg:max-w-[720px] lg:border-r" data-testid="smk-editor-left">
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-white px-3 pt-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                data-testid={`smk-tab-${t.key}`}
                className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-ink'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count != null && (
                  <span className={`rounded-full px-1.5 text-[11px] ${tab === t.key ? 'bg-primary/10' : 'bg-slate-100'}`}>{t.count}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="space-y-4 p-4 lg:flex-1 lg:overflow-y-auto">
            {/* ===== Shapka ===== */}
            {tab === 'header' && (
              <>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs text-slate-600">
                  {tr('Logo hamma formalarda bir xil. Matnda {laboratoriya}, {kod}, {sana} yozsangiz, hujjatda avtomatik almashtiriladi.')}
                </div>
                <Card title={tr('Markaziy qatorlar (forma nomidan yuqorida)')}>
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
                    {orgLines.length < 6 && <AddLink onClick={() => setHeader({ orgLines: [...orgLines, ''] })}>{tr("Qator qo'shish")}</AddLink>}
                  </div>
                </Card>
                <Card title={tr("O'ng tomondagi rekvizitlar")}>
                  {meta.length > 0 && (
                    <div className="mb-1 grid grid-cols-[1fr_1fr_96px] gap-1 px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      <span>{tr('Nomi')}</span>
                      <span>{tr('Qiymati')}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {meta.map((m, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_96px] items-center gap-1">
                        <input
                          className="input-field !py-2"
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
                        <div className="flex items-center">
                          <IconBtn onClick={() => setHeader({ meta: moveIn(meta, i, -1) })} disabled={i === 0}><ArrowUp className="h-4 w-4" /></IconBtn>
                          <IconBtn onClick={() => setHeader({ meta: moveIn(meta, i, 1) })} disabled={i === meta.length - 1}><ArrowDown className="h-4 w-4" /></IconBtn>
                          <IconBtn danger onClick={() => setHeader({ meta: meta.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></IconBtn>
                        </div>
                      </div>
                    ))}
                    {meta.length < 8 && <AddLink onClick={() => setHeader({ meta: [...meta, { label: '', value: '' }] })}>{tr("Rekvizit qo'shish")}</AddLink>}
                  </div>
                </Card>
              </>
            )}

            {/* ===== Matn bloklari ===== */}
            {tab === 'blocks' && (
              <div className="space-y-4" data-testid="smk-blocks">
                <Card
                  title={tr("Blok qo'shish")}
                  hint={tr("Shapkadan keyin yoki jadvaldan keyin chiqadigan matnlar: «Tasdiqlayman», akt matni, imzolar. Bo'sh joylar uchun ____ yozing.")}
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {BLOCK_PRESETS().map((p) => {
                      const Icon = PRESET_ICONS[p.key] || Pilcrow;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setBlocks([...blocks, ...(p.blocks || [p.block]).map((x) => ({ ...x }))])}
                          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-left text-xs font-medium text-ink transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-primary" />
                          <span className="leading-tight">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Card>
                {blocks.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-slate-400">
                    {tr("Matn bloki yo'q. Yuqoridagi tugmalar bilan qo'shing.")}
                  </p>
                )}
                {blocks.map((b, i) => (
                  <div key={i} className="rounded-xl border border-border bg-white p-3 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <Segmented
                        testId="smk-block-position"
                        value={b.position}
                        onChange={(v) => setBlock(i, { position: v })}
                        options={[
                          { value: 'before', label: tr('Jadvaldan oldin'), icon: ArrowUpToLine },
                          { value: 'after', label: tr('Jadvaldan keyin'), icon: ArrowDownToLine },
                        ]}
                      />
                      <div className="ml-auto flex items-center">
                        <IconBtn onClick={() => setBlocks(moveIn(blocks, i, -1))} disabled={i === 0} title={tr('Yuqoriga')}><ArrowUp className="h-4 w-4" /></IconBtn>
                        <IconBtn onClick={() => setBlocks(moveIn(blocks, i, 1))} disabled={i === blocks.length - 1} title={tr('Pastga')}><ArrowDown className="h-4 w-4" /></IconBtn>
                        <IconBtn danger onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} title={tr("O'chirish")}><Trash2 className="h-4 w-4" /></IconBtn>
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Segmented
                        testId="smk-block-layout"
                        value={b.layout || 'full'}
                        onChange={(v) => setBlock(i, { layout: v })}
                        options={[
                          { value: 'full', label: tr("To'liq kenglik"), icon: RectangleHorizontal },
                          { value: 'left', label: tr('Chap yarmi'), icon: PanelLeft },
                          { value: 'right', label: tr("O'ng yarmi"), icon: PanelRight },
                        ]}
                      />
                      <Segmented
                        testId="smk-block-align"
                        value={b.align}
                        onChange={(v) => setBlock(i, { align: v })}
                        options={[
                          { value: 'left', icon: AlignLeft, title: tr('Chapga') },
                          { value: 'center', icon: AlignCenter, title: tr('Markazga') },
                          { value: 'right', icon: AlignRight, title: tr("O'ngga") },
                          { value: 'justify', icon: AlignJustify, title: tr('Ikki tomonga') },
                        ]}
                      />
                      <div className="flex items-center gap-1">
                        <ToggleBtn on={!!b.bold} onClick={() => setBlock(i, { bold: !b.bold })} title={tr('Qalin')}><Bold className="h-3.5 w-3.5" /></ToggleBtn>
                        <ToggleBtn on={b.size === 'large'} onClick={() => setBlock(i, { size: b.size === 'large' ? 'normal' : 'large' })} title={tr('Katta shrift')}>A+</ToggleBtn>
                        <ToggleBtn on={!!b.indent} onClick={() => setBlock(i, { indent: !b.indent })} title={tr('Xatboshi')}><IndentIncrease className="h-3.5 w-3.5" /></ToggleBtn>
                      </div>
                    </div>
                    <textarea
                      rows={Math.min(8, Math.max(2, String(b.text || '').split('\n').length))}
                      className="input-field resize-y font-serif text-sm"
                      style={{ textAlign: b.align === 'justify' ? 'left' : b.align, fontWeight: b.bold ? 600 : 400 }}
                      placeholder={tr('Matn — qatorlar Enter bilan')}
                      value={b.text}
                      onChange={(e) => setBlock(i, { text: e.target.value })}
                    />
                  </div>
                ))}
                {blocks.length > 1 && (
                  <p className="text-xs text-slate-400">
                    {tr("Ikki blokni yonma-yon qo'yish uchun birinchisini «Chap yarmi», undan keyingisini «O'ng yarmi» qiling.")}
                  </p>
                )}
              </div>
            )}

            {/* ===== Jadval ===== */}
            {tab === 'table' && (
              <>
                <Card
                  title={tr('Jadval')}
                  action={<Switch testId="smk-table-toggle" checked={hasTable} onChange={(v) => setHeader({ table: v })} label={tr('Jadval bor')} />}
                >
                  {!hasTable && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                      {tr("Jadvalsiz forma: hujjat faqat shapka va matn bloklaridan iborat bo'ladi. Jadval kerak bo'lsa, «Jadval bor» belgisini qo'ying.")}
                    </p>
                  )}
                  {hasTable && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {tr('Ustunlar')} ({form.fields.length})
                      </p>
                      {form.fields.length === 0 && (
                        <p className="rounded-lg bg-slate-50 px-4 py-4 text-center text-sm text-slate-400">{tr("Hali ustun yo'q. Jadval ustunlarini qo'shing.")}</p>
                      )}
                      {form.fields.map((f, i) => (
                        <div key={f.key} className="rounded-lg border border-border bg-slate-50 p-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 ring-1 ring-border">{i + 1}</span>
                            <input
                              className="input-field !w-auto min-w-[160px] flex-1 !py-2"
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
                      <AddLink onClick={addField}>{tr("Ustun qo'shish")}</AddLink>
                      {initial.id && initial.entryCount > 0 && (
                        <p className="text-xs text-amber-600">
                          {tr("Bu formada yozuvlar bor: ustun o'chirilsa yoki turi o'zgarsa, eski yozuvlardagi shu qiymat keyingi saqlashda yo'qoladi.")}
                        </p>
                      )}
                    </div>
                  )}
                </Card>

                {hasTable && (
                  <Card
                    testId="smk-footer-editor"
                    title={`${tr('Yakuniy qatorlar (Итого)')} (${footer.length})`}
                    hint={tr("Jadval oxiridagi qator: birinchi bir nechta katak birlashtirilib matn yoziladi, belgilangan son/pul ustunlarida yig'indi avtomatik hisoblanadi.")}
                  >
                    <div className="space-y-2">
                      {footer.map((r, i) => (
                        <div key={i} className="rounded-lg border border-border bg-white p-2.5 ring-1 ring-amber-100">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Sigma className="h-4 w-4 shrink-0 text-amber-500" />
                            <input
                              className="input-field !w-auto min-w-[140px] flex-1 !py-2"
                              placeholder="Итого:"
                              value={r.label}
                              onChange={(e) => setFooterRow(i, { label: e.target.value })}
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                              {tr('Birlashtirilgan kataklar')}
                              <select
                                className="input-field !w-auto !py-1.5 text-xs"
                                value={Math.min(r.labelSpan || 1, form.fields.length + 1)}
                                onChange={(e) => setFooterRow(i, { labelSpan: Number(e.target.value) })}
                              >
                                {Array.from({ length: form.fields.length + 1 }, (_, k) => k + 1).map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </label>
                            <div className="ml-auto flex items-center">
                              <IconBtn danger onClick={() => setFooter(footer.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconBtn>
                            </div>
                          </div>
                          {numericFields.length > 0 ? (
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span>{tr("Yig'indi:")}</span>
                              {numericFields.map((f) => (
                                <label key={f.key} className="flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={(r.sums || []).includes(f.key)}
                                    onChange={(e) =>
                                      setFooterRow(i, { sums: e.target.checked ? [...(r.sums || []), f.key] : (r.sums || []).filter((k) => k !== f.key) })
                                    }
                                    className="h-4 w-4 rounded border-border text-primary"
                                  />
                                  {f.label || '…'}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-400">{tr("Yig'indi uchun ustun turi \"Raqam\" yoki \"Pul (summa)\" bo'lishi kerak.")}</p>
                          )}
                        </div>
                      ))}
                      {footer.length < 5 && (
                        <AddLink
                          onClick={() => setFooter([...footer, { label: 'Итого:', labelSpan: Math.min(2, form.fields.length + 1), sums: numericFields.map((f) => f.key) }])}
                        >
                          {tr("Yakuniy qator qo'shish")}
                        </AddLink>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* ===== Sozlamalar ===== */}
            {tab === 'settings' && (
              <Card title={tr('Sozlamalar')}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Tavsif / ko\'rsatma')}</label>
                    <textarea rows={3} className="input-field resize-y" value={form.description} onChange={(e) => set('description', e.target.value)} />
                  </div>
                  <div className="flex flex-wrap items-end gap-6">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink">{tr('Tartib raqami')}</label>
                      <input type="number" className="input-field !w-32" value={form.order} onChange={(e) => set('order', e.target.value)} />
                    </div>
                    <div className="pb-2.5">
                      <Switch testId="smk-active-toggle" checked={!!form.isActive} onChange={(v) => set('isActive', v)} label={tr('Faol')} />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* --- O'ng: hujjat ko'rinishi --- */}
        <aside className="min-w-0 flex-1 p-4 lg:overflow-y-auto lg:p-6" data-testid="smk-preview-pane">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Eye className="h-4 w-4 text-slate-400" /> {tr("Hujjat ko'rinishi")}
            </h4>
            <Segmented
              testId="smk-orientation"
              value={orientation}
              onChange={(v) => setHeader({ orientation: v })}
              options={[
                { value: 'portrait', label: tr('Kitob (tik)') },
                { value: 'landscape', label: tr('Albom (yotiq)') },
              ]}
            />
          </div>
          <PaperPreview html={previewHtml} orientation={orientation} />
        </aside>
      </div>
    </div>
  );
}
