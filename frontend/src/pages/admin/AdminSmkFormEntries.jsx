import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Download, Printer, ArrowLeft, FileText } from 'lucide-react';
import { canOpenOnline } from './AdminSmkTemplateEditor.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk, uploadFiles } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Pagination } from '../../components/UI.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { tr, locName } from '../../i18n/tr.js';

// /admin/sifat/:labSlug/:formId — laboratoriya tanlagan formaning yozuvlari:
// yangi yozuv (forma maydonlari bo'yicha), tahrirlash, o'chirish, chop etish
// va asl shablonni yuklab olish.

const PAGE_SIZE = 25;
const fmtDate = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('.') : '');

// Ro'yxat va chop etish uchun qiymatning matn ko'rinishi.
function displayValue(field, value) {
  if (field.type === 'checkbox') return value ? tr('Ha') : tr("Yo'q");
  if (value === null || value === undefined || value === '') return '';
  if (field.type === 'date') return fmtDate(value);
  if (field.type === 'file') return tr('Fayl');
  return String(value);
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Yangi oynada chop etish uchun sahifa (bitta yozuv yoki ro'yxat).
function printHtml(title, body) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:24px}
  h1{font-size:16px;margin:0 0 4px} .sub{color:#555;margin-bottom:16px}
  table{border-collapse:collapse;width:100%} th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f1f1f1} .kv th{width:35%} td{white-space:pre-wrap}
  .sign{margin-top:40px;display:flex;justify-content:space-between}
</style></head><body>${body}</body></html>`);
  w.document.close();
  // Inline skript o'rniga shu yerdan (CSP inline skriptni bloklashi mumkin).
  w.focus();
  w.print();
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
  const heading = `${form.code} — ${form.title}`;

  const printEntry = (entry) => {
    const rows = fields
      .map((f) => `<tr><th>${esc(f.label)}</th><td>${esc(displayValue(f, entry.data?.[f.key]))}</td></tr>`)
      .join('');
    printHtml(
      heading,
      `<h1>${esc(heading)}</h1><div class="sub">${esc(locName(lab))} · ${esc(fmtDate(entry.createdAt))}</div>
       <table class="kv">${rows}</table>
       <div class="sign"><span>${esc(tr("To'ldirdi"))}: ${esc(entry.createdBy?.fullName || '')} ____________</span><span>${esc(tr('Imzo'))}: ____________</span></div>`
    );
  };

  const printList = () => {
    const head = `<tr><th>№</th>${fields.map((f) => `<th>${esc(f.label)}</th>`).join('')}<th>${esc(tr("To'ldirdi"))}</th></tr>`;
    const body = (data?.items || [])
      .map(
        (e, i) =>
          `<tr><td>${(page - 1) * PAGE_SIZE + i + 1}</td>${fields
            .map((f) => `<td>${esc(displayValue(f, e.data?.[f.key]))}</td>`)
            .join('')}<td>${esc(e.createdBy?.fullName || '')}</td></tr>`
      )
      .join('');
    printHtml(heading, `<h1>${esc(heading)}</h1><div class="sub">${esc(locName(lab))}</div><table>${head}${body}</table>`);
  };

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
          {form.templateUrl && canOpenOnline(form.templateUrl) && (
            <Link to={`/admin/sifat/shablon/${form.id}`} className="btn-secondary !py-2.5">
              <FileText className="h-4 w-4" /> {tr('Shablonni ochish')}
            </Link>
          )}
          {form.templateUrl && (
            <a href={form.templateUrl} download={form.templateName || undefined} className="btn-secondary !py-2.5">
              <Download className="h-4 w-4" /> {tr('Shablonni yuklab olish')}
            </a>
          )}
          {data?.items?.length > 0 && (
            <button onClick={printList} className="btn-secondary !py-2.5">
              <Printer className="h-4 w-4" /> {tr('Chop etish')}
            </button>
          )}
          {fields.length > 0 && (
            <button onClick={() => setEditing({ data: {} })} className="btn-primary !py-2.5">
              <Plus className="h-4 w-4" /> {tr('Yangi yozuv')}
            </button>
          )}
        </div>
      </div>

      {fields.length === 0 ? (
        <EmptyState
          message={
            form.templateUrl
              ? tr("Bu forma tizimda to'ldirilmaydi — shablonni yuklab olib foydalaning.")
              : tr("Bu formaga hali maydonlar qo'shilmagan.")
          }
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            {data === null ? (
              <Loading />
            ) : data.error ? (
              <div className="p-6"><ErrorState onRetry={load} /></div>
            ) : data.items.length === 0 ? (
              <EmptyState message={tr("Hali yozuv yo'q.")} />
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
                      <td className="px-4 py-3 text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      {fields.map((f) => (
                        <td key={f.key} className="max-w-[260px] truncate px-4 py-3 text-ink">
                          {f.type === 'file' && e.data?.[f.key] ? (
                            <a href={e.data[f.key]} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              {tr('Fayl')}
                            </a>
                          ) : (
                            displayValue(f, e.data?.[f.key]) || '—'
                          )}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {e.createdBy?.fullName || '—'}
                        <span className="block text-xs text-slate-400">{fmtDate(e.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => printEntry(e)} className="rounded-lg p-2 text-slate-500 hover:bg-bg-light" title={tr('Chop etish')}>
                            <Printer className="h-4 w-4" />
                          </button>
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
  const [uploading, setUploading] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!fields.some((f) => f.type === 'staff')) return;
    adminSmk
      .staffOptions()
      .then((d) => setStaff(d.items || []))
      .catch(() => setStaff([]));
  }, [fields]);

  const upload = async (key, files) => {
    if (!files?.length) return;
    setUploading(key);
    try {
      const res = await uploadFiles(files);
      set(key, res.files[0].url);
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Fayl yuklashda xatolik.'), 'error');
    } finally {
      setUploading(null);
    }
  };

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
    <Modal open onClose={onClose} title={`${form.code} — ${entry.id ? tr('Tahrirlash') : tr('Yangi yozuv')}`} size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const wide = f.type === 'textarea' || f.type === 'file';
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
              ) : f.type === 'file' ? (
                <div>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" onChange={(e) => upload(f.key, e.target.files)} className="text-sm" />
                  {uploading === f.key && <p className="mt-1 text-xs text-primary">{tr('Yuklanmoqda, biroz kuting...')}</p>}
                  {values[f.key] && uploading !== f.key && (
                    <p className="mt-1 flex items-center gap-2 text-xs">
                      <a href={values[f.key]} target="_blank" rel="noreferrer" className="text-primary hover:underline">{tr('Yuklangan fayl')}</a>
                      <button type="button" onClick={() => set(f.key, '')} className="text-red-500">{tr("O'chirish")}</button>
                    </p>
                  )}
                </div>
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
        <button onClick={save} disabled={saving || !!uploading} className="btn-primary">
          {uploading ? tr('Fayl yuklanmoqda...') : saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </Modal>
  );
}
