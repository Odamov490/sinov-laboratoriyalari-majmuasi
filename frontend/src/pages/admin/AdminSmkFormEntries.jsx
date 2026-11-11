import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Printer, ArrowLeft, FileText, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Pagination } from '../../components/UI.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { tr, locName } from '../../i18n/tr.js';
import { buildDocumentHtml, displayValue, exportWord, exportPdf, printDocument, useFormLogo } from './smk/smkDocument.js';

// /admin/sifat/:labSlug/:formId — laboratoriya tanlagan forma: hujjat shapkasi
// va jadval (qatorlar = yozuvlar). Qator qo'shish/tahrirlash/o'chirish; tayyor
// jadvalni Word yoki PDF qilib yuklab olish, chop etish.

const PAGE_SIZE = 25;
const fmtDate = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('.') : '');

// Eksport uchun barcha qatorlar (eskidan yangiga — jurnal tartibi).
async function fetchAllRows(labId, formId) {
  const all = [];
  for (let page = 1; page < 200; page += 1) {
    const d = await adminSmk.entries(labId, formId, { page, pageSize: 500 });
    all.push(...(d.items || []));
    if (all.length >= d.total || !(d.items || []).length) break;
  }
  return all.reverse();
}

export default function AdminSmkFormEntries() {
  const { labSlug, formId } = useParams();
  const { showToast } = useToast();
  const [lab, setLab] = useState(null);
  const [form, setForm] = useState(null);
  const [failed, setFailed] = useState(null); // 'notfound' | 'error'
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // {id?, data}
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [exporting, setExporting] = useState(null); // 'word' | 'pdf' | 'print'
  const logo = useFormLogo();

  useEffect(() => {
    let alive = true;
    setFailed(null);
    adminSmk
      .board()
      .then(async (b) => {
        const found = (b.labs || []).find((l) => l.slug === labSlug);
        if (!found) throw Object.assign(new Error(), { notFound: true });
        const f = await adminSmk.labForm(found.id, formId);
        if (!alive) return;
        setLab(found);
        setForm(f);
      })
      .catch((err) => alive && setFailed(err.notFound || err?.response?.status === 404 ? 'notfound' : 'error'));
    return () => {
      alive = false;
    };
  }, [labSlug, formId]);

  const load = useCallback(() => {
    if (!lab || !form) return;
    adminSmk
      .entries(lab.id, form.id, { page, pageSize: PAGE_SIZE })
      .then(setData)
      .catch(() => setData({ items: [], total: 0, error: true }));
  }, [lab, form, page]);
  useEffect(load, [load]);

  const remove = async (id) => {
    try {
      await adminSmk.removeEntry(id);
      showToast(tr("O'chirildi."), 'success');
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    }
  };

  if (failed === 'notfound') return <EmptyState message={tr('Forma topilmadi yoki bu laboratoriyaga biriktirilmagan.')} />;
  if (failed) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!lab || !form) return <Loading />;

  const fields = form.fields || [];
  const headerHtml = buildDocumentHtml({ form, lab, rows: [], logo }).headerHtml;

  const runExport = async (kind) => {
    // Chop etish oynasi bosish paytida ochiladi (popup bloklanmasin).
    const printWin = kind === 'print' ? window.open('', '_blank') : null;
    setExporting(kind);
    try {
      const rows = await fetchAllRows(lab.id, form.id);
      const doc = { form, lab, rows };
      if (kind === 'word') await exportWord(doc);
      else if (kind === 'pdf') await exportPdf(doc);
      else await printDocument(doc, printWin);
    } catch {
      printWin?.close();
      showToast(tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setExporting(null);
    }
  };
  const exportBtn = (kind, icon, label) => (
    <button onClick={() => runExport(kind)} disabled={!!exporting} className="btn-secondary !py-2.5">
      {exporting === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : icon} {label}
    </button>
  );

  return (
    <div>
      <Link to="/admin/sifat" className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {locName(lab)}
      </Link>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink">
            <span className="mr-2 text-slate-400">{form.code}</span>
            {form.title}
          </h1>
          {form.description && <p className="mt-1 max-w-3xl whitespace-pre-line text-sm text-slate-500">{form.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fields.length > 0 && (
            <>
              {exportBtn('word', <FileText className="h-4 w-4" />, 'Word')}
              {exportBtn('pdf', <FileDown className="h-4 w-4" />, 'PDF')}
              {exportBtn('print', <Printer className="h-4 w-4" />, tr('Chop etish'))}
            </>
          )}
          {fields.length > 0 && (
            <button onClick={() => setEditing({ data: {} })} className="btn-primary !py-2.5">
              <Plus className="h-4 w-4" /> {tr("Qator qo'shish")}
            </button>
          )}
        </div>
      </div>

      {/* Hujjat shapkasi (Word/PDF'dagi bilan bir xil). HTML buildDocumentHtml'da esc() bilan tozalangan. */}
      <div className="mb-4 overflow-x-auto rounded-xl border border-border bg-white p-4">
        <div data-testid="smk-header" className="min-w-[640px] text-black" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      </div>
      {fields.length === 0 ? (
        <EmptyState message={tr("Bu formaga hali ustunlar qo'shilmagan.")} />
      ) : (
        <>
          <div className="card overflow-x-auto">
            {data === null ? (
              <Loading />
            ) : data.error ? (
              <div className="p-6"><ErrorState onRetry={load} /></div>
            ) : data.items.length === 0 ? (
              <EmptyState message={tr("Hali qator yo'q. Word/PDF'da bo'sh blank chiqadi.")} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">№</th>
                    {fields.map((f) => (
                      <th key={f.key} className="whitespace-nowrap px-4 py-3">{f.label}</th>
                    ))}
                    <th className="whitespace-nowrap px-4 py-3">{tr("To'ldirdi")}</th>
                    <th className="px-4 py-3 text-right">{tr('Amallar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((e, i) => (
                    <tr key={e.id} className="hover:bg-bg-light/60">
                      {/* Jurnal raqami (Word/PDF bilan bir xil): eng eskisi — 1. Ekranda yangisi tepada. */}
                      <td className="px-4 py-3 text-slate-400">{data.total - ((page - 1) * PAGE_SIZE + i)}</td>
                      {fields.map((f) => (
                        <td key={f.key} className="max-w-[260px] truncate px-4 py-3 text-ink" title={displayValue(f, e.data?.[f.key])}>
                          {displayValue(f, e.data?.[f.key]) || '—'}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {e.createdBy?.fullName || '—'}
                        <span className="block text-xs text-slate-400">{fmtDate(e.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing({ id: e.id, data: e.data || {} })} className="rounded-lg p-2 text-primary hover:bg-bg-light" title={tr('Tahrirlash')}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(e.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title={tr("O'chirish")}>
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
          {data && !data.error && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}
        </>
      )}

      {editing && (
        <EntryEditor
          lab={lab}
          form={form}
          entry={editing}
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
        onConfirm={() => remove(confirmDelete)}
        message={tr("Yozuvni o'chirasizmi?")}
      />
    </div>
  );
}

function EntryEditor({ lab, form, entry, onClose, onSaved }) {
  const { showToast } = useToast();
  const fields = form.fields || [];
  const [values, setValues] = useState(() => {
    const v = {};
    fields.forEach((f) => {
      const cur = entry.data?.[f.key];
      v[f.key] = f.type === 'checkbox' ? Boolean(cur) : cur ?? '';
    });
    return v;
  });
  const [staff, setStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!fields.some((f) => f.type === 'staff')) return;
    adminSmk
      .staffOptions()
      .then((d) => setStaff(d.items || []))
      .catch(() => setStaff([]));
  }, [fields]);

  const save = async () => {
    setSaving(true);
    try {
      if (entry.id) await adminSmk.updateEntry(entry.id, values);
      else await adminSmk.createEntry(lab.id, form.id, values);
      showToast(tr('Saqlandi.'), 'success');
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${form.code} — ${entry.id ? tr('Tahrirlash') : tr("Qator qo'shish")}`} size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const wide = f.type === 'textarea';
          return (
            <div key={f.key} className={wide ? 'sm:col-span-2' : ''}>
              {f.type !== 'checkbox' && (
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
              )}
              {f.type === 'textarea' ? (
                <textarea rows={3} className="input-field resize-y" value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              ) : f.type === 'select' ? (
                <select className="input-field" value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="">—</option>
                  {(f.options || []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === 'staff' ? (
                <select className="input-field" value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="">{staff === null ? tr('Yuklanmoqda...') : '—'}</option>
                  {/* Eski yozuvdagi xodim ro'yxatda bo'lmasa ham ko'rinsin. */}
                  {values[f.key] && staff && !staff.some((s) => s.fullName === values[f.key]) && (
                    <option value={values[f.key]}>{values[f.key]}</option>
                  )}
                  {(staff || []).map((s) => (
                    <option key={s.id} value={s.fullName}>{s.fullName}</option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 pt-7 text-sm font-medium text-ink">
                  <input type="checkbox" checked={!!values[f.key]} onChange={(e) => set(f.key, e.target.checked)} className="h-5 w-5 rounded border-border text-primary" />
                  {f.label}
                </label>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                  className="input-field"
                  value={values[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">{tr('Bekor qilish')}</button>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </Modal>
  );
}
