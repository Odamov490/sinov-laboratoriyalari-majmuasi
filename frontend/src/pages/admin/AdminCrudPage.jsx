import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X as XIcon, Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Download, Cake } from 'lucide-react';
import { adminResource, uploadFiles } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { SearchBar, Pagination, Select } from '../../components/UI.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const MONTH_NAMES_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkShared, setBulkShared] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const exportPdfRef = useRef(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState(null);

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

  useEffect(() => {
    if (!config.birthdayPin) return;
    const dateField = config.birthdayPin.dateField || 'birthDate';
    const limit = config.birthdayPin.limit || 3;
    resource
      .list({ pageSize: 1000 })
      .then((full) => {
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const withDays = full.items
          .filter((item) => item[dateField])
          .map((item) => {
            const bd = new Date(item[dateField]);
            let next = Date.UTC(now.getFullYear(), bd.getUTCMonth(), bd.getUTCDate());
            if (next < todayUTC) next = Date.UTC(now.getFullYear() + 1, bd.getUTCMonth(), bd.getUTCDate());
            const daysUntil = Math.round((next - todayUTC) / 86400000);
            return { item, daysUntil, month: bd.getUTCMonth(), day: bd.getUTCDate() };
          })
          .sort((a, b) => a.daysUntil - b.daysUntil)
          .slice(0, limit);
        setUpcomingBirthdays(withDays);
      })
      .catch(() => setUpcomingBirthdays([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAsyncOptions = () => {
    const asyncFields = config.fields.filter((f) => f.type === 'async-select' || f.type === 'async-multi-select');
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
      else if (f.type === 'checkbox') initial[f.name] = false;
      else if (f.type === 'async-multi-select') initial[f.name] = [];
      else initial[f.name] = '';
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
    // Prisma on save. `fromItem` lets a field derive its form value from a
    // differently-shaped relation on the item (e.g. a m2m array of objects).
    const initial = {};
    config.fields.forEach((f) => {
      let val;
      if (f.fromItem) val = f.fromItem(item);
      else if (f.type === 'checkbox') val = item[f.name] ?? false;
      else if (f.type === 'async-multi-select') val = item[f.name] ?? [];
      else val = item[f.name] ?? '';
      if (f.type === 'date' && val) val = String(val).slice(0, 10);
      initial[f.name] = val;
    });
    setForm(initial);
    loadAsyncOptions();
    setModalOpen(true);
  };

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleFileChange = async (name, fileList) => {
    if (!fileList?.length) return;
    setUploadingField(name);
    try {
      const res = await uploadFiles(fileList);
      handleChange(name, res.files[0].url);
      showToast('Fayl yuklandi.', 'success');
    } catch {
      showToast('Fayl yuklashda xatolik.', 'error');
    } finally {
      setUploadingField(null);
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
        if (f.type === 'date') {
          payload[f.name] = payload[f.name] ? new Date(payload[f.name]).toISOString() : null;
        }
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

  const openBulk = () => {
    setBulkFiles([]);
    const initialShared = {};
    (config.bulkUpload?.sharedFieldNames || []).forEach((n) => { initialShared[n] = ''; });
    setBulkShared(initialShared);
    loadAsyncOptions();
    setBulkOpen(true);
  };

  const handleBulkFilesSelected = (fileList) => {
    const newOnes = Array.from(fileList).map((file) => ({ file, status: 'pending' }));
    setBulkFiles((prev) => [...prev, ...newOnes]);
  };

  const removeBulkFile = (file) => {
    setBulkFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const runBulkUpload = async () => {
    setBulkSaving(true);
    const pendingFiles = bulkFiles
      .filter((f) => f.status === 'pending' || f.status === 'error')
      .map((f) => f.file);
    let successCount = 0;
    let failCount = 0;
    const chunkSize = 5;

    for (let i = 0; i < pendingFiles.length; i += chunkSize) {
      const chunkFiles = pendingFiles.slice(i, i + chunkSize);
      setBulkFiles((prev) => prev.map((f) => (chunkFiles.includes(f.file) ? { ...f, status: 'uploading' } : f)));
      try {
        const res = await uploadFiles(chunkFiles);
        for (let j = 0; j < chunkFiles.length; j++) {
          try {
            const payload = { [config.bulkUpload.fileField]: res.files[j]?.url };
            if (config.bulkUpload.titleField) {
              payload[config.bulkUpload.titleField] = chunkFiles[j].name.replace(/\.[^./]+$/, '');
            }
            (config.bulkUpload.sharedFieldNames || []).forEach((name) => {
              payload[name] = bulkShared[name] || null;
            });
            await resource.create(payload);
            successCount += 1;
            setBulkFiles((prev) => prev.map((f) => (f.file === chunkFiles[j] ? { ...f, status: 'done' } : f)));
          } catch {
            failCount += 1;
            setBulkFiles((prev) => prev.map((f) => (f.file === chunkFiles[j] ? { ...f, status: 'error' } : f)));
          }
        }
      } catch {
        failCount += chunkFiles.length;
        setBulkFiles((prev) => prev.map((f) => (chunkFiles.includes(f.file) ? { ...f, status: 'error' } : f)));
      }
    }

    setBulkSaving(false);
    load();
    if (successCount > 0) {
      showToast(
        `${successCount} ta fayl yuklandi.${failCount ? ` ${failCount} tasi xato bilan tugadi.` : ''}`,
        failCount ? 'error' : 'success'
      );
    } else if (failCount > 0) {
      showToast('Fayllarni yuklashda xatolik yuz berdi.', 'error');
    }
    if (failCount === 0 && successCount > 0) setBulkOpen(false);
  };

  const exportRows = (items) =>
    items.map((item, idx) => {
      const row = { '№': idx + 1 };
      config.exportColumns.forEach((c) => {
        row[c.label] = c.get ? c.get(item) : item[c.key] ?? '—';
      });
      return row;
    });

  const fetchAllForExport = async () => {
    const full = await resource.list({ q: q || undefined, page: 1, pageSize: 1000 });
    return full.items;
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const items = await fetchAllForExport();
      const XLSX = await import('xlsx');
      const rows = exportRows(items);
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.title.slice(0, 31));
      XLSX.writeFile(wb, `${config.path}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      showToast('Excel export xatolik yuz berdi.', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const items = await fetchAllForExport();
      const rows = exportRows(items);
      const headers = Object.keys(rows[0] || { '№': '' });

      const container = exportPdfRef.current;
      container.innerHTML = '';

      const title = document.createElement('h2');
      title.textContent = config.exportTitle || `${config.title} — Sinov Laboratoriyalari Majmuasi`;
      title.style.cssText = 'font-size:16px;font-weight:700;margin-bottom:12px;color:#0B3A63;font-family:Arial,sans-serif;';
      container.appendChild(title);

      const table = document.createElement('table');
      table.style.cssText = 'border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11px;color:#17212B;';
      const headHtml = `<thead><tr>${headers
        .map((h) => `<th style="border:1px solid #E2E8F0;padding:6px 8px;background:#F5F8FB;text-align:left;">${h}</th>`)
        .join('')}</tr></thead>`;
      const bodyHtml = `<tbody>${rows
        .map(
          (r) =>
            `<tr>${Object.values(r)
              .map((v) => `<td style="border:1px solid #E2E8F0;padding:6px 8px;">${v}</td>`)
              .join('')}</tr>`
        )
        .join('')}</tbody>`;
      table.innerHTML = headHtml + bodyHtml;
      container.appendChild(table);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const pxPerMm = canvas.width / imgWidth;
      const pageContentHeightPx = Math.floor((pageHeight - margin * 2) * pxPerMm);

      // Slice the rendered canvas into page-sized chunks and embed each
      // slice on its own page, instead of re-embedding the full image on
      // every page (which multiplies the PDF's file size by the page count).
      let renderedPx = 0;
      let firstPage = true;
      while (renderedPx < canvas.height) {
        const sliceHeightPx = Math.min(pageContentHeightPx, canvas.height - renderedPx);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        sliceCanvas.getContext('2d').drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
        // JPEG (not PNG) here: jsPDF stores PNG image data essentially
        // uncompressed, which blew this up to ~60MB for a ~70-row table.
        // JPEG at high quality is visually lossless for this flat,
        // mostly-white table content and comes out a few hundred KB.
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        if (!firstPage) pdf.addPage();
        pdf.addImage(sliceData, 'JPEG', margin, margin, imgWidth, sliceHeightMm);
        renderedPx += sliceHeightPx;
        firstPage = false;
      }

      pdf.save(`${config.path}-${new Date().toISOString().slice(0, 10)}.pdf`);
      container.innerHTML = '';
    } catch {
      showToast('PDF export xatolik yuz berdi.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-ink">{config.title}</h1>
        <div className="flex items-center gap-2">
          {config.exportable && (
            <>
              <button onClick={handleExportExcel} disabled={exportingExcel} className="btn-secondary !py-2.5">
                <FileSpreadsheet className="h-4 w-4" /> {exportingExcel ? 'Tayyorlanmoqda...' : 'Excel'}
              </button>
              <button onClick={handleExportPdf} disabled={exportingPdf} className="btn-secondary !py-2.5">
                <Download className="h-4 w-4" /> {exportingPdf ? 'Tayyorlanmoqda...' : 'PDF'}
              </button>
            </>
          )}
          {config.bulkUpload && (
            <button onClick={openBulk} className="btn-secondary !py-2.5">
              <Upload className="h-4 w-4" /> Ko'p fayl yuklash
            </button>
          )}
          <button onClick={openCreate} className="btn-primary !py-2.5">
            <Plus className="h-4 w-4" /> Qo'shish
          </button>
        </div>
      </div>

      {config.birthdayPin && upcomingBirthdays && upcomingBirthdays.length > 0 && (
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {upcomingBirthdays.map(({ item, daysUntil, month, day }) => (
            <button
              key={item.id}
              onClick={() => openEdit(item)}
              className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3 text-left hover:border-accent/60 hover:bg-accent/10 transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Cake className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink text-sm">{item.fullName}</span>
                <span className="block text-xs text-slate-500">
                  {MONTH_NAMES_UZ[month]} {day} —{' '}
                  {daysUntil === 0 ? 'Bugun!' : daysUntil === 1 ? 'Ertaga' : `${daysUntil} kun qoldi`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

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
              ) : f.type === 'async-multi-select' ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                  {asyncOptions[f.name] === undefined ? (
                    <p className="text-xs text-slate-400 px-1 py-1">Yuklanmoqda...</p>
                  ) : asyncOptions[f.name].length === 0 ? (
                    <p className="text-xs text-slate-400 px-1 py-1">
                      Hozircha ro'yxat bo'sh. Avval tegishli bo'limda yozuv yarating.
                    </p>
                  ) : (
                    asyncOptions[f.name].map((item) => {
                      const checked = (form[f.name] || []).includes(item.id);
                      return (
                        <label key={item.id} className="flex items-center gap-2 px-1 py-1 text-sm text-ink hover:bg-bg-light rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const current = form[f.name] || [];
                              handleChange(
                                f.name,
                                e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
                              );
                            }}
                            className="h-4 w-4 rounded border-border text-primary"
                          />
                          {f.optionsLabel ? f.optionsLabel(item) : item.nameUz || item.name || item.id}
                        </label>
                      );
                    })
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
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.webm"
                    onChange={(e) => handleMultiFileChange(f.name, e.target.files)}
                    className="text-sm"
                  />
                  {uploadingField === f.name && (
                    <p className="text-xs text-primary mt-1">Yuklanmoqda, biroz kuting...</p>
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
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.webm"
                    onChange={(e) => handleFileChange(f.name, e.target.files)}
                    className="text-sm"
                  />
                  {uploadingField === f.name && (
                    <p className="text-xs text-primary mt-1">Yuklanmoqda, biroz kuting...</p>
                  )}
                  {form[f.name] && uploadingField !== f.name && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{form[f.name]}</p>
                  )}
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
          <button onClick={save} disabled={saving || !!uploadingField} className="btn-primary">
            {uploadingField ? 'Fayl yuklanmoqda...' : saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        message="Ushbu yozuvni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
      />

      {config.bulkUpload && (
        <Modal
          open={bulkOpen}
          onClose={() => !bulkSaving && setBulkOpen(false)}
          title="Bir nechta fayl yuklash"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Fayllar</label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
                onChange={(e) => {
                  handleBulkFilesSelected(e.target.files);
                  e.target.value = '';
                }}
                className="text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Fayllar bir martada 5 tadan qilib partiyalarga bo'lib yuklanadi.
              </p>
            </div>

            {(config.bulkUpload.sharedFieldNames || []).map((name) => {
              const field = config.fields.find((f) => f.name === name);
              if (!field) return null;
              return (
                <div key={name}>
                  <label className="block text-sm font-medium text-ink mb-1.5">{field.label}</label>
                  <Select
                    value={bulkShared[name] ?? ''}
                    onChange={(v) => setBulkShared((s) => ({ ...s, [name]: v }))}
                    placeholder={
                      asyncOptions[name] === undefined ? 'Yuklanmoqda...' : `${field.label} tanlang (barchasi uchun)`
                    }
                    options={(asyncOptions[name] || []).map((item) => ({
                      value: item.id,
                      label: field.optionsLabel ? field.optionsLabel(item) : item.nameUz || item.name || item.id,
                    }))}
                  />
                </div>
              );
            })}

            {bulkFiles.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {bulkFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate text-ink">{f.file.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {f.status === 'pending' && <span className="text-xs text-slate-400">Kutilmoqda</span>}
                      {f.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {f.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {f.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {f.status !== 'uploading' && f.status !== 'done' && (
                        <button
                          type="button"
                          onClick={() => removeBulkFile(f.file)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setBulkOpen(false)} disabled={bulkSaving} className="btn-secondary">
              Yopish
            </button>
            <button
              onClick={runBulkUpload}
              disabled={bulkSaving || bulkFiles.length === 0 || bulkFiles.every((f) => f.status === 'done')}
              className="btn-primary"
            >
              {bulkSaving ? 'Yuklanmoqda...' : 'Yuklash'}
            </button>
          </div>
        </Modal>
      )}

      {config.exportable && (
        <div
          ref={exportPdfRef}
          style={{ position: 'fixed', left: '-9999px', top: 0, width: `${config.exportWidth || 1100}px`, background: '#ffffff', padding: '16px' }}
        />
      )}
    </div>
  );
}