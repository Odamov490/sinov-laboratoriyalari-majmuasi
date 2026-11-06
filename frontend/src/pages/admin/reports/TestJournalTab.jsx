import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertTriangle, ArrowUp, ArrowDown, FileSpreadsheet, X as XIcon, Columns3, Trash2 } from 'lucide-react';
import { adminTestJournal } from '../../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../../components/StateViews.jsx';
import { SearchBar, Pagination } from '../../../components/UI.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { Modal } from '../../../components/Modal.jsx';
import TestJournalRecordModal from './TestJournalRecordModal.jsx';
import { resultOptions, RESULT_LABELS, RESULT_STYLES, directionOptions, PAYMENT_LABELS, formatMoney } from './journalConstants';
import { ROW_COLORS, resolveColumns } from './journalColumns.jsx';
import ColumnSettingsModal from './ColumnSettingsModal.jsx';
import { RESULT_FILLS, addTableSheet, newWorkbook, downloadWorkbook } from './excelExport';
import { tr } from '../../../i18n/tr.js';

const PAGE_SIZES = [25, 50, 100, 200];
const EXPORT_PAGE_SIZE = 500;
const ALL_SHEET = 'all';
const SHOVQIN_SHEET = 'shovqin';

const EMPTY_FILTERS = {
  q: '',
  year: '',
  from: '',
  to: '',
  certificationBodyId: '',
  result: '',
  direction: '',
  locationId: '',
  paymentStatus: '',
  needsReview: false,
};

// Sheet a record belongs to in the Excel export: like the paper journal,
// noise tests get their own sheet; everything else goes by product type.
const sheetNameOf = (r) => ((r.directions || []).includes('SHOVQIN') ? 'Shovqin' : r.productType?.nameUz || 'Boshqa');

// Chronological like the paper journal: act date, then original row.
const byJournalOrder = (a, b) =>
  String(a.actDate || '9999').localeCompare(String(b.actDate || '9999')) || (a.sourceRow || 0) - (b.sourceRow || 0);

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

// "Jurnal" tab of /admin/hisobot — laid out like the Excel journal: one tab
// per sheet (product type + Shovqin), the journal's columns and row colors.
// Result and protocol date are edited right in the table; a row click opens
// the full record dialog.
export default function TestJournalTab({ dictionaries, showFinance, canEditLayout, onLayoutChange, onRecordsChanged }) {
  const { showToast } = useToast();
  const [sheet, setSheet] = useState(ALL_SHEET);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [sort, setSort] = useState({ by: 'actDate', dir: 'desc' });
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState({ open: false, record: null });
  const [exporting, setExporting] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  // Bir nechta qatorni belgilab o'chirish. allMatching — filtrga mos barcha
  // sahifalardagi yozuvlar (faqat SUPER_ADMIN: canEditLayout).
  const [selected, setSelected] = useState(() => new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const sheetProduct = dictionaries.productTypes.find((p) => p.id === sheet);
  const brandLabel = sheet === SHOVQIN_SHEET ? tr('Muzlatkich markasi') : sheetProduct ? tr('{0} markasi', sheetProduct.nameUz) : tr('Marka');
  const ctx = { brandLabel, saveCell: null, savingCell };

  // Shared layout (order, hidden, extra columns) set by SUPER_ADMIN; money
  // columns only to finance roles.
  const columns = resolveColumns(dictionaries.layout, showFinance).filter((c) => !c.hidden);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const params = useMemo(() => {
    const p = { page, pageSize, sortBy: sort.by, sortDir: sort.dir };
    if (sheet === SHOVQIN_SHEET) p.direction = 'SHOVQIN';
    else if (sheet !== ALL_SHEET) {
      p.productTypeId = sheet;
      p.excludeDirection = 'SHOVQIN';
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (k === 'needsReview') {
        if (v) p.needsReview = 1;
      } else if (v !== '') p[k] = v;
    });
    return p;
  }, [sheet, filters, page, pageSize, sort]);

  const load = () => {
    setError(false);
    adminTestJournal
      .list(params)
      .then(setData)
      .catch(() => setError(true));
  };

  // Varaq, filtr yoki saralash o'zgarsa — tanlov tozalanadi (ko'rinmaydigan
  // yozuvlar tasodifan o'chib ketmasligi uchun). Sahifa almashsa saqlanadi.
  const selectionScope = JSON.stringify({ ...params, page: undefined, pageSize: undefined });
  useEffect(() => {
    setSelected(new Set());
    setAllMatching(false);
  }, [selectionScope]);

  useEffect(() => {
    setData(null);
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // In-table edit of result / protocol date: saves at once and patches the row.
  ctx.saveCell = async (record, field, value) => {
    setSavingCell(`${record.id}:${field}`);
    try {
      const updated = await adminTestJournal.update(record.id, { [field]: value || null });
      setData((d) => ({ ...d, items: d.items.map((i) => (i.id === record.id ? { ...i, ...updated } : i)) }));
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Saqlashda xatolik yuz berdi.'), 'error');
    } finally {
      setSavingCell(null);
    }
  };

  // Exports every row of the current sheet/filters (all pages) with all
  // journal columns: one Excel sheet per journal sheet, № restarting on each
  // and a JAMI row at the bottom.
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
        const name = sheetNameOf(r);
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(r);
      });
      const order = [...dictionaries.productTypes.map((p) => p.nameUz), 'Shovqin'];
      const rank = (n) => (order.indexOf(n) === -1 ? 99 : order.indexOf(n));
      const names = [...groups.keys()].sort((a, b) => rank(a) - rank(b));

      const wb = await newWorkbook();
      names.forEach((name) => {
        const records = groups.get(name).sort(byJournalOrder);
        const product = dictionaries.productTypes.find((p) => p.nameUz === name);
        const sheetCtx = { brandLabel: name === 'Shovqin' ? 'Muzlatkich markasi' : product ? `${name} markasi` : 'Marka' };
        addTableSheet(wb, name, {
          columns: [
            { header: '№', width: 6, align: 'center' },
            ...columns.map((c) => ({
              header: c.label(sheetCtx),
              width: c.wide ? 30 : 15,
              align: c.right ? 'right' : c.center ? 'center' : 'left',
              money: c.key === 'amount',
            })),
          ],
          // Same row colors as the table on screen (by result).
          rows: records.map((r, i) => ({ values: [i + 1, ...columns.map((c) => c.text(r))], fill: RESULT_FILLS[r.result] })),
          total: [
            'JAMI',
            ...columns.map((c, i) => {
              if (c.sum) return records.reduce((acc, r) => acc + Number(c.text(r) || 0), 0);
              return i === 0 ? tr('{0} ta yozuv', records.length) : '';
            }),
          ],
        });
      });
      await downloadWorkbook(wb, tr('sinovlar-jurnali_{0}.xlsx', new Date().toISOString().slice(0, 10)));
    } catch {
      showToast(tr('Excel eksportda xatolik yuz berdi.'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const pageIds = data?.items?.map((r) => r.id) || [];
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeSelected = pageIds.some((id) => selected.has(id));
  const selectedCount = allMatching ? data?.total || 0 : selected.size;

  const toggleRow = (id) => {
    setAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    if (allMatching) {
      setAllMatching(false);
      setSelected(new Set());
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setAllMatching(false);
  };

  const bulkDelete = async () => {
    setBulkBusy(true);
    try {
      let payload;
      if (allMatching) {
        const filtersOnly = { ...params };
        ['page', 'pageSize', 'sortBy', 'sortDir'].forEach((k) => delete filtersOnly[k]);
        payload = { all: true, filters: filtersOnly, expectedCount: data.total };
      } else {
        payload = { ids: [...selected] };
      }
      const { deleted } = await adminTestJournal.bulkDelete(payload);
      showToast(tr("{0} ta yozuv o'chirildi.", deleted), 'success');
      setConfirmBulk(false);
      clearSelection();
      setPage(1);
      load();
      onRecordsChanged?.();
    } catch (err) {
      showToast(err?.response?.data?.error || tr("O'chirishda xatolik."), 'error');
      if (err?.response?.status === 409) {
        setConfirmBulk(false);
        clearSelection();
        load();
      }
    } finally {
      setBulkBusy(false);
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
    bodies: dictionaries.bodies.map((b) => ({ value: b.id, label: b.name })),
    locations: dictionaries.locations.map((l) => ({ value: l.id, label: l.nameUz })),
    results: resultOptions(filters.result),
    directions: directionOptions(filters.direction ? [filters.direction] : []).map((d) => ({ value: d.value, label: d.short })),
    payments: [...Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label })), { value: 'none', label: tr('Kuzatilmagan') }],
  };
  const thisYear = new Date().getFullYear();
  const years = [thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }));
  const hasFilters = Object.entries(filters).some(([k, v]) => (k === 'needsReview' ? v : v !== ''));

  const sheets = [
    { key: ALL_SHEET, label: tr('Hammasi') },
    ...dictionaries.productTypes.filter((p) => p.isActive !== false).map((p) => ({ key: p.id, label: p.nameUz })),
    { key: SHOVQIN_SHEET, label: tr('Shovqin') },
  ];

  const cell = 'border border-slate-300 px-2 py-1 align-middle';

  return (
    <div>
      {/* Sheets, like the Excel workbook's tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {sheets.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setSheet(s.key);
              setPage(1);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              sheet === s.key ? 'border-primary bg-primary text-white' : 'border-border bg-white text-slate-600 hover:bg-bg-light'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] max-w-md">
            <SearchBar value={filters.q} onChange={(v) => setFilter('q', v)} placeholder={tr('Akt ID, marka yoki shartnoma...')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={filters.needsReview}
              onChange={(e) => setFilter('needsReview', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <AlertTriangle className="h-4 w-4 text-amber-500" /> {tr('Tekshirish kerak')}
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
              <XIcon className="h-3.5 w-3.5" /> {tr('Filtrlarni tozalash')}
            </button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {canEditLayout && (
              <button onClick={() => setLayoutOpen(true)} className="btn-secondary !py-2">
                <Columns3 className="h-4 w-4" /> {tr('Ustunlar')}
              </button>
            )}
            <button onClick={exportExcel} disabled={exporting || !data?.total} className="btn-secondary !py-2">
              <FileSpreadsheet className="h-4 w-4" /> {exporting ? tr('Tayyorlanmoqda...') : 'Excel'}
            </button>
            <button onClick={() => setModal({ open: true, record: null })} className="btn-primary !py-2">
              <Plus className="h-4 w-4" /> {tr('Yangi yozuv')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <FilterSelect value={filters.year} onChange={(v) => setFilter('year', v)} placeholder={tr('Yil: hammasi')} options={years} />
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            {tr('Kelgan:')}
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter('from', e.target.value)} className="input-field !py-2 text-sm" />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            —
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} className="input-field !py-2 text-sm" />
          </label>
          <FilterSelect value={filters.certificationBodyId} onChange={(v) => setFilter('certificationBodyId', v)} placeholder={tr('Idora')} options={options.bodies} />
          <FilterSelect value={filters.result} onChange={(v) => setFilter('result', v)} placeholder={tr('Natija')} options={options.results} />
          {sheet !== SHOVQIN_SHEET && (
            <FilterSelect value={filters.direction} onChange={(v) => setFilter('direction', v)} placeholder={tr("Yo'nalish")} options={options.directions} />
          )}
          <FilterSelect value={filters.locationId} onChange={(v) => setFilter('locationId', v)} placeholder={tr('Manzil')} options={options.locations} />
          {showFinance && (
            <FilterSelect value={filters.paymentStatus} onChange={(v) => setFilter('paymentStatus', v)} placeholder={tr("To'lov")} options={options.payments} />
          )}
        </div>
      </div>

      {/* Belgilangan qatorlar paneli */}
      {selectedCount > 0 && data && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm">
          <span className="font-semibold text-ink">{tr('{0} ta yozuv tanlandi', selectedCount)}</span>
          {canEditLayout && !allMatching && pageAllSelected && data.total > selected.size && (
            <button type="button" onClick={() => setAllMatching(true)} className="font-medium text-primary hover:underline">
              {tr('Filtrga mos barcha {0} ta yozuvni tanlash', data.total)}
            </button>
          )}
          {allMatching && <span className="text-slate-600">{tr('(filtrga mos barcha sahifalardagi yozuvlar)')}</span>}
          <button type="button" onClick={clearSelection} className="text-slate-500 hover:text-ink">
            {tr('Tanlovni bekor qilish')}
          </button>
          <button
            type="button"
            onClick={() => setConfirmBulk(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" /> {tr("Tanlanganlarni o'chirish")}
          </button>
        </div>
      )}

      {/* Natija ranglari izohi */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        {resultOptions().map(({ value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter('result', filters.result === value ? '' : value)}
            title={tr("Shu natija bo'yicha filtrlash")}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ring-1 ring-black/5 transition ${RESULT_STYLES[value] || ''} ${
              filters.result === value ? 'ring-2 ring-primary' : 'hover:brightness-95'
            }`}
          >
            {RESULT_LABELS[value]}
          </button>
        ))}
      </div>

      {/* Journal table */}
      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6">
            <ErrorState onRetry={load} />
          </div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState message={tr("Bu varaqda filtr bo'yicha yozuv topilmadi.")} />
        ) : (
          <table className="w-full border-collapse text-[13px] text-ink">
            <thead>
              <tr className="bg-[#dbe5f1] text-[12px] font-medium text-slate-700">
                <th className={`${cell} w-9 text-center`}>
                  <input
                    type="checkbox"
                    aria-label={tr('Sahifadagi barcha qatorlarni belgilash')}
                    checked={pageAllSelected || allMatching}
                    ref={(el) => {
                      if (el) el.indeterminate = !allMatching && pageSomeSelected && !pageAllSelected;
                    }}
                    onChange={togglePage}
                    className="h-4 w-4 cursor-pointer rounded border-slate-400 text-primary"
                  />
                </th>
                <th className={`${cell} w-10 text-center`}>№</th>
                {columns.map((c) => (
                  <th key={c.key} className={`${cell} text-center leading-tight ${c.wide ? 'min-w-[180px]' : 'min-w-[90px]'}`}>
                    {c.sortBy ? (
                      <button type="button" onClick={() => toggleSort(c.sortBy)} className="inline-flex items-center gap-1 hover:text-ink">
                        {c.label(ctx)}
                        {sort.by === c.sortBy && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />)}
                      </button>
                    ) : (
                      c.label(ctx)
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((r, idx) => (
                <tr
                  key={r.id}
                  onClick={() => setModal({ open: true, record: r })}
                  className={`cursor-pointer hover:brightness-95 ${ROW_COLORS[r.result] || ''} ${
                    allMatching || selected.has(r.id) ? 'outline outline-2 -outline-offset-2 outline-red-400' : ''
                  }`}
                >
                  <td className={`${cell} text-center`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={tr('Qatorni belgilash')}
                      checked={allMatching || selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-400 text-primary"
                    />
                  </td>
                  <td className={`${cell} text-center tabular-nums`}>
                    <span className="inline-flex items-center gap-1">
                      {(data.page - 1) * data.pageSize + idx + 1}
                      {r.needsReview && (
                        <span title={tr('Tekshirish kerak: {0}', (r.reviewReasons || []).join('; '))}>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        </span>
                      )}
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      onClick={c.render ? (e) => e.stopPropagation() : undefined}
                      className={`${cell} ${c.center ? 'text-center' : ''} ${c.right ? 'text-right tabular-nums whitespace-nowrap' : ''} ${
                        c.wide ? 'max-w-[260px]' : ''
                      }`}
                    >
                      {c.render ? c.render(r, ctx) : c.display ? c.display(r) : c.text(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#dbe5f1] font-semibold">
                <td className={cell} />
                <td className={`${cell} text-center`}>{tr('Jami')}</td>
                {columns.map((c, i) => (
                  <td key={c.key} className={`${cell} ${c.right ? 'text-right tabular-nums whitespace-nowrap' : c.center ? 'text-center' : ''}`}>
                    {c.key === 'sampleCount'
                      ? data.totals.sampleCount
                      : c.key === 'amount'
                        ? formatMoney(data.totals.amount)
                        : i === 0
                          ? tr('{0} ta yozuv', data.totals.records)
                          : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {data && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
          <label className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            {tr('Qatorlar:')}
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
        dictionaries={dictionaries}
        showFinance={showFinance}
        onClose={() => setModal({ open: false, record: null })}
        customColumns={resolveColumns(dictionaries.layout).filter((c) => c.custom)}
        onSaved={() => {
          setModal({ open: false, record: null });
          load();
          onRecordsChanged?.();
        }}
      />

      <Modal open={confirmBulk} onClose={() => !bulkBusy && setConfirmBulk(false)} title={tr("Yozuvlarni o'chirish")} size="sm">
        <p className="text-sm text-slate-600">
          {allMatching
            ? tr("Joriy varaq va filtrlarga mos BARCHA {0} ta yozuv o'chiriladi (barcha sahifalardagi).", selectedCount)
            : tr("Belgilangan {0} ta yozuv o'chiriladi.", selectedCount)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {tr("Yozuvlar jadvaldan, hisobot va Excel eksportdan olib tashlanadi; har biri tarixda «o'chirdi» deb qayd etiladi.")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setConfirmBulk(false)} disabled={bulkBusy} className="btn-secondary">
            {tr('Bekor qilish')}
          </button>
          <button
            onClick={bulkDelete}
            disabled={bulkBusy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> {bulkBusy ? tr("O'chirilmoqda...") : tr("{0} ta yozuvni o'chirish", selectedCount)}
          </button>
        </div>
      </Modal>

      {canEditLayout && (
        <ColumnSettingsModal
          open={layoutOpen}
          layout={dictionaries.layout}
          onClose={() => setLayoutOpen(false)}
          onSaved={(columns) => {
            setLayoutOpen(false);
            onLayoutChange(columns);
          }}
        />
      )}
    </div>
  );
}
