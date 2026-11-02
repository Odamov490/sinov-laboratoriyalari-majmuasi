import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertTriangle, X as XIcon, ArrowUp, ArrowDown, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { adminTestJournal } from '../../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../../components/StateViews.jsx';
import { SearchBar, Pagination } from '../../../components/UI.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import TestJournalRecordModal from './TestJournalRecordModal.jsx';
import {
  RESULT_LABELS,
  RESULT_STYLES,
  CANCELLED_BY_LABELS,
  DIRECTIONS,
  DIRECTION_SHORT,
  PAYMENT_LABELS,
  formatMoney,
  formatDate,
} from './journalConstants';

const PAGE_SIZES = [25, 50, 100, 200];
const EXPORT_PAGE_SIZE = 500;

const SHOVQIN_SHEET = 'Shovqin';
const dateCell = (v) => (v ? formatDate(v) : '');

// Sheet a record belongs to in the journal-style export: like the paper/Excel
// journal, noise tests get their own sheet; everything else goes by product.
const sheetOf = (r) => ((r.directions || []).includes('SHOVQIN') ? SHOVQIN_SHEET : r.productType?.nameUz || 'Boshqa');

// One Excel row in the source journal's column order (№ restarts per sheet).
function exportRow(r, idx, { showFinance, withWeight }) {
  const result =
    (RESULT_LABELS[r.result] || r.result) +
    (r.result === 'QISMAN_MOS_EMAS' && r.nonconformingCount ? ` (${r.nonconformingCount})` : '') +
    (r.cancelledBy ? `, ${CANCELLED_BY_LABELS[r.cancelledBy].toLowerCase()}` : '');
  return {
    '№': idx + 1,
    'Akt ID': r.actNo || '',
    Tashkilot: r.certificationBody?.name || '',
    'Akt sanasi': dateCell(r.actDate),
    Ijrochi: r.executorName || '',
    'Namuna qabul qilingan sana': dateCell(r.sampleReceivedDate) + (r.sampleReceivedTime ? ` ${r.sampleReceivedTime}` : ''),
    'Namunalar soni': r.sampleCount ?? '',
    'Bekor qilingan': r.cancelledSampleCount || '',
    ...(withWeight && { "Og'irlik": r.weightNote || '' }),
    'Bayonnoma sanasi': dateCell(r.protocolDate),
    "Yo'nalish": (r.directions || []).map((d) => DIRECTION_SHORT[d] || d).join('+'),
    Natija: result,
    Marka: r.brand || '',
    Joy: (r.location?.nameUz || '') + (r.isRepeat ? ' (takroriy)' : ''),
    ...(showFinance && {
      Shartnoma: [r.contractNo, r.contractDate && `от ${dateCell(r.contractDate)}`].filter(Boolean).join(' '),
      "Summa (so'm)": r.amount ?? '',
      "To'lov": r.paymentStatus ? PAYMENT_LABELS[r.paymentStatus] : '',
    }),
    Izoh: [...(r.notes || []), ...(r.needsReview ? (r.reviewReasons || []).map((x) => `Tekshirish: ${x}`) : [])].join('; '),
  };
}

// Chronological like the paper journal: act date, then original row.
const byJournalOrder = (a, b) =>
  String(a.actDate || '9999').localeCompare(String(b.actDate || '9999')) || (a.sourceRow || 0) - (b.sourceRow || 0);

const EMPTY_FILTERS = {
  q: '',
  year: '',
  from: '',
  to: '',
  productTypeId: '',
  certificationBodyId: '',
  result: '',
  direction: '',
  locationId: '',
  paymentStatus: '',
  needsReview: false,
  actNo: '',
};

function FilterSelect({ value, onChange, placeholder, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field !py-2 text-sm">
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// "Jurnal" tab of /admin/hisobot: filterable, sortable journal table with a
// per-filter total row; clicking a row opens the edit dialog, and result /
// protocol date can be changed right in the table.
export default function TestJournalTab({ dictionaries, showFinance, onRecordsChanged }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [sort, setSort] = useState({ by: 'sampleReceivedDate', dir: 'desc' });
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState({ open: false, record: null, copyFrom: null });
  const [exporting, setExporting] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  const { showToast } = useToast();

  const params = useMemo(() => {
    const p = { page, pageSize, sortBy: sort.by, sortDir: sort.dir };
    Object.entries(filters).forEach(([k, v]) => {
      if (k === 'needsReview') {
        if (v) p.needsReview = 1;
      } else if (v !== '') p[k] = v;
    });
    return p;
  }, [filters, page, pageSize, sort]);

  const load = () => {
    setError(false);
    adminTestJournal
      .list(params)
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    setData(null);
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Exports every row matching the current filters (all pages) in the shape
  // of the paper/Excel journal: one sheet per product type plus "Shovqin",
  // № restarting per sheet and a JAMI row at the bottom of each.
  const exportExcel = async () => {
    setExporting(true);
    try {
      const all = [];
      for (let p = 1; ; p += 1) {
        const res = await adminTestJournal.list({ ...params, page: p, pageSize: EXPORT_PAGE_SIZE });
        all.push(...res.items);
        if (all.length >= res.total || res.items.length === 0) break;
      }

      const groups = new Map();
      all.forEach((r) => {
        const sheet = sheetOf(r);
        if (!groups.has(sheet)) groups.set(sheet, []);
        groups.get(sheet).push(r);
      });
      // Product types in dictionary order, then Shovqin, then anything else.
      const order = [...dictionaries.productTypes.map((p) => p.nameUz), SHOVQIN_SHEET];
      const sheetNames = [...groups.keys()].sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      sheetNames.forEach((name) => {
        const records = groups.get(name).sort(byJournalOrder);
        const withWeight = records.some((r) => r.weightNote);
        const rows = records.map((r, i) => exportRow(r, i, { showFinance, withWeight }));
        const sum = (key) => records.reduce((acc, r) => acc + Number(r[key] || 0), 0);
        rows.push({
          '№': 'JAMI',
          'Akt ID': `${records.length} ta yozuv`,
          'Namunalar soni': sum('sampleCount'),
          'Bekor qilingan': sum('cancelledSampleCount'),
          ...(showFinance && { "Summa (so'm)": sum('amount') }),
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = Object.keys(rows[0]).map((k) => ({
          wch: ['Tashkilot', 'Marka', 'Izoh', 'Shartnoma'].includes(k) ? 28 : k === '№' ? 6 : 14,
        }));
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      });
      XLSX.writeFile(wb, `sinovlar-jurnali_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      showToast('Excel eksportda xatolik yuz berdi.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // In-table edit of result / protocol date: saves at once and patches the row.
  const saveCell = async (record, field, value) => {
    setSavingCell(`${record.id}:${field}`);
    try {
      const updated = await adminTestJournal.update(record.id, { [field]: value || null });
      setData((d) => ({ ...d, items: d.items.map((i) => (i.id === record.id ? { ...i, ...updated } : i)) }));
    } catch (err) {
      showToast(err?.response?.data?.error || 'Saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setSavingCell(null);
    }
  };

  const setFilter = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };

  const toggleSort = (by) => {
    setSort((s) => (s.by === by ? { by, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'desc' }));
    setPage(1);
  };

  const options = {
    productTypes: dictionaries.productTypes.map((p) => ({ value: p.id, label: p.nameUz })),
    bodies: dictionaries.bodies.map((b) => ({ value: b.id, label: b.name })),
    locations: dictionaries.locations.map((l) => ({ value: l.id, label: l.nameUz })),
    results: Object.entries(RESULT_LABELS).map(([value, label]) => ({ value, label })),
    directions: DIRECTIONS.map((d) => ({ value: d.value, label: d.short })),
    payments: [...Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label })), { value: 'none', label: 'Kuzatilmagan' }],
  };
  const thisYear = new Date().getFullYear();
  const years = [thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }));

  const SortHeader = ({ by, children, className = '' }) => (
    <th className={`px-3 py-3 ${className}`}>
      <button type="button" onClick={() => toggleSort(by)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink">
        {children}
        {sort.by === by && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  const hasFilters = Object.entries(filters).some(([k, v]) => (k === 'needsReview' ? v : v !== ''));

  return (
    <div>
      {/* Filters */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] max-w-md">
            <SearchBar
              value={filters.q}
              onChange={(v) => setFilter('q', v)}
              placeholder={showFinance ? 'Akt ID, marka yoki shartnoma...' : 'Akt ID yoki marka...'}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={filters.needsReview}
              onChange={(e) => setFilter('needsReview', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Tekshirish kerak
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Filtrlarni tozalash
            </button>
          )}
          <button onClick={exportExcel} disabled={exporting || !data?.total} className="btn-secondary !py-2 ml-auto">
            <FileSpreadsheet className="h-4 w-4" /> {exporting ? 'Tayyorlanmoqda...' : 'Excel'}
          </button>
          <button onClick={() => setModal({ open: true, record: null, copyFrom: null })} className="btn-primary !py-2">
            <Plus className="h-4 w-4" /> Yangi yozuv
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <FilterSelect value={filters.year} onChange={(v) => setFilter('year', v)} placeholder="Yil: hammasi" options={years} />
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Qabul:
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter('from', e.target.value)} className="input-field !py-2 text-sm" />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            —
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} className="input-field !py-2 text-sm" />
          </label>
          <FilterSelect value={filters.productTypeId} onChange={(v) => setFilter('productTypeId', v)} placeholder="Mahsulot turi" options={options.productTypes} />
          <FilterSelect value={filters.certificationBodyId} onChange={(v) => setFilter('certificationBodyId', v)} placeholder="Buyurtmachi" options={options.bodies} />
          <FilterSelect value={filters.result} onChange={(v) => setFilter('result', v)} placeholder="Natija" options={options.results} />
          <FilterSelect value={filters.direction} onChange={(v) => setFilter('direction', v)} placeholder="Yo'nalish" options={options.directions} />
          <FilterSelect value={filters.locationId} onChange={(v) => setFilter('locationId', v)} placeholder="Joy" options={options.locations} />
          {showFinance && (
            <FilterSelect value={filters.paymentStatus} onChange={(v) => setFilter('paymentStatus', v)} placeholder="To'lov" options={options.payments} />
          )}
        </div>

        {filters.actNo && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Akt: <span className="font-semibold">{filters.actNo}</span>
            <button type="button" onClick={() => setFilter('actNo', '')} className="hover:text-ink" aria-label="Akt filtrini olib tashlash">
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6">
            <ErrorState onRetry={load} />
          </div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState message="Filtr bo'yicha yozuv topilmadi." />
        ) : (
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">№</th>
                <SortHeader by="actNo">Akt ID</SortHeader>
                <th className="px-3 py-3">Buyurtmachi</th>
                <SortHeader by="sampleReceivedDate">Qabul sanasi</SortHeader>
                <SortHeader by="sampleCount" className="text-right">Soni</SortHeader>
                <SortHeader by="protocolDate">Bayonnoma</SortHeader>
                <th className="px-3 py-3">Yo'nalish</th>
                <th className="px-3 py-3">Natija</th>
                <th className="px-3 py-3">Marka</th>
                <th className="px-3 py-3">Joy</th>
                {showFinance && <SortHeader by="amount" className="text-right">Summa</SortHeader>}
                {showFinance && <th className="px-3 py-3">To'lov</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((r, idx) => (
                <tr
                  key={r.id}
                  onClick={() => setModal({ open: true, record: r, copyFrom: null })}
                  className={`cursor-pointer hover:bg-bg-light/60 ${r.needsReview ? 'bg-amber-50/60' : ''}`}
                >
                  <td className="px-3 py-2.5 text-slate-400 tabular-nums">{(data.page - 1) * data.pageSize + idx + 1}</td>
                  <td className="px-3 py-2.5 max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      {r.needsReview && (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" title={(r.reviewReasons || []).join('; ')} />
                      )}
                      <span className="font-medium text-ink truncate">{r.actNo || '—'}</span>
                    </div>
                    <p className="text-xs text-slate-400">{r.productType?.nameUz}</p>
                    {r.actRecordsCount > 1 && filters.actNo !== r.actNo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter('actNo', r.actNo);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Bu akt yana {r.actRecordsCount - 1} ta qatorda bor
                      </button>
                    )}
                    {r.needsReview && (r.reviewReasons || []).length > 0 && (
                      <p className="text-xs text-amber-700 truncate" title={r.reviewReasons.join('; ')}>
                        {r.reviewReasons.join('; ')}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ink max-w-[180px] truncate" title={r.certificationBody?.name}>
                    {r.certificationBody?.name || '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(r.sampleReceivedDate)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                    {r.sampleCount ?? '—'}
                    {r.cancelledSampleCount > 0 && <span className="ml-1 text-xs text-slate-400">(−{r.cancelledSampleCount})</span>}
                  </td>
                  {/* Editable in place: clicks here don't open the dialog. */}
                  <td className="px-3 py-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={r.protocolDate || ''}
                      disabled={savingCell === `${r.id}:protocolDate`}
                      onChange={(e) => saveCell(r, 'protocolDate', e.target.value)}
                      className="w-[8.5rem] rounded-md border border-transparent bg-transparent px-1 py-1 text-sm hover:border-border focus:border-primary focus:outline-none"
                      aria-label="Bayonnoma sanasi"
                    />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs">{(r.directions || []).map((d) => DIRECTION_SHORT[d] || d).join(' + ') || '—'}</td>
                  <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.result}
                      disabled={savingCell === `${r.id}:result`}
                      onChange={(e) => saveCell(r, 'result', e.target.value)}
                      className={`cursor-pointer whitespace-nowrap rounded-full border-0 py-0.5 pl-2 pr-6 text-xs font-medium focus:ring-2 focus:ring-primary/40 ${RESULT_STYLES[r.result] || ''}`}
                      aria-label="Natija"
                    >
                      {Object.entries(RESULT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                          {value === 'QISMAN_MOS_EMAS' && r.result === value && r.nonconformingCount ? ` (${r.nonconformingCount})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px] truncate" title={r.brand || ''}>
                    {r.brand || '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {r.location?.nameUz || '—'}
                    {r.isRepeat && <span className="ml-1 text-xs text-slate-400">(takroriy)</span>}
                  </td>
                  {showFinance && <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{formatMoney(r.amount)}</td>}
                  {showFinance && (
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{r.paymentStatus ? PAYMENT_LABELS[r.paymentStatus] : '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-bg-light font-semibold text-ink">
                <td className="px-3 py-3" colSpan={4}>
                  Jami (filtr bo'yicha): {data.totals.records} ta yozuv
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{data.totals.sampleCount}</td>
                <td colSpan={5} />
                {showFinance && <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">{formatMoney(data.totals.amount)}</td>}
                {showFinance && <td />}
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {data && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
          <label className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            Qatorlar:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="input-field !w-auto !py-1.5"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <TestJournalRecordModal
        open={modal.open}
        record={modal.record}
        copyFrom={modal.copyFrom}
        dictionaries={dictionaries}
        showFinance={showFinance}
        onClose={() => setModal({ open: false, record: null, copyFrom: null })}
        onCopy={(record) => setModal({ open: true, record: null, copyFrom: record })}
        onSaved={() => {
          setModal({ open: false, record: null, copyFrom: null });
          load();
          onRecordsChanged?.();
        }}
      />
    </div>
  );
}
