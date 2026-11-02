import React from 'react';
import { RESULT_LABELS, DIRECTION_SHORT, PAYMENT_LABELS, CANCELLED_BY_LABELS, formatDate, formatMoney } from './journalConstants';

// Columns of the journal table, in the paper/Excel journal's order. The same
// list drives the on-screen table, the "Ustunlar" picker and the Excel export,
// so a new column is one entry here.
//   label(ctx)   header text (ctx.brandLabel depends on the open sheet)
//   text(r)      plain value — shown in the cell and written to Excel
//   render(r,c)  optional custom cell (in-table editing)
//   visible      shown by default (the Excel journal's columns)
//   finance      only for roles that see money fields
//   sum          summed in the JAMI row; sortBy enables header sorting

const dateText = (v) => (v ? formatDate(v) : '');

export const resultText = (r) =>
  (RESULT_LABELS[r.result] || r.result) +
  (r.result === 'QISMAN_MOS_EMAS' && r.nonconformingCount ? ` (${r.nonconformingCount} ta)` : '');

// Row colors of the Excel journal: green = mos, red = mos emas,
// yellow = not submitted / cancelled; pending rows stay white.
export const ROW_COLORS = {
  MOS: 'bg-green-200/80',
  MOS_EMAS: 'bg-red-300/70',
  QISMAN_MOS_EMAS: 'bg-red-300/70',
  KORIB_CHIQISH: 'bg-red-300/70',
  NAMUNA_TAQDIM_ETILMADI: 'bg-yellow-200/90',
  BEKOR_QILINDI: 'bg-yellow-200/90',
  KUTILMOQDA: 'bg-white',
};

const inlineInput =
  'w-full min-w-[7.5rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-[13px] hover:border-slate-400 focus:border-primary focus:bg-white focus:outline-none';

export const COLUMNS = [
  { key: 'productType', label: () => 'Mahsulot turi', text: (r) => r.productType?.nameUz || '' },
  {
    key: 'certificationBody',
    label: () => 'Sertifikatlashtirish idorasi nomi',
    text: (r) => r.certificationBody?.name || '',
    visible: true,
    wide: true,
  },
  { key: 'actNo', label: () => 'Namuna tanlash dalolatnomasi raqami ID', text: (r) => r.actNo || '', visible: true, sortBy: 'actNo', center: true },
  { key: 'actDate', label: () => 'Namuna tanlash dalolatnomasi sanasi', text: (r) => dateText(r.actDate), visible: true, sortBy: 'actDate', center: true },
  { key: 'executorName', label: () => 'Namuna tanlash dalolatnomasi F.I.Sh', text: (r) => r.executorName || '', visible: true, center: true },
  {
    key: 'sampleReceivedDate',
    label: () => 'Namuna kelgan sanasi',
    text: (r) => dateText(r.sampleReceivedDate),
    visible: true,
    sortBy: 'sampleReceivedDate',
    center: true,
  },
  { key: 'sampleReceivedTime', label: () => 'Namuna kelgan vaqti', text: (r) => r.sampleReceivedTime || '', center: true },
  { key: 'sampleCount', label: () => 'Namuna(lar) soni', text: (r) => r.sampleCount ?? '', visible: true, sortBy: 'sampleCount', sum: true, center: true },
  { key: 'weightNote', label: () => "Og'irligi", text: (r) => r.weightNote || '', center: true },
  {
    key: 'protocolDate',
    label: () => 'Bayonnoma sanasi',
    text: (r) => dateText(r.protocolDate),
    visible: true,
    sortBy: 'protocolDate',
    center: true,
    render: (r, ctx) => (
      <input
        type="date"
        value={r.protocolDate || ''}
        disabled={ctx.savingCell === `${r.id}:protocolDate`}
        onChange={(e) => ctx.saveCell(r, 'protocolDate', e.target.value)}
        className={inlineInput}
        aria-label="Bayonnoma sanasi"
      />
    ),
  },
  {
    key: 'directions',
    label: () => "Sinov o'tkazilishi kerak bo'lgan yo'nalish (BZ, EMM, EE)",
    text: (r) => (r.directions || []).map((d) => DIRECTION_SHORT[d] || d).join('+'),
    visible: true,
    center: true,
  },
  {
    key: 'result',
    label: () => 'Natija',
    text: resultText,
    visible: true,
    render: (r, ctx) => (
      <select
        value={r.result}
        disabled={ctx.savingCell === `${r.id}:result`}
        onChange={(e) => ctx.saveCell(r, 'result', e.target.value)}
        className={`${inlineInput} cursor-pointer`}
        aria-label="Natija"
      >
        {Object.entries(RESULT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {value === r.result ? resultText(r) : label}
          </option>
        ))}
      </select>
    ),
  },
  { key: 'nonconformingCount', label: () => 'Mos emas namunalar soni', text: (r) => r.nonconformingCount ?? '', center: true },
  { key: 'cancelledBy', label: () => 'Bekor qilgan tomon', text: (r) => (r.cancelledBy ? CANCELLED_BY_LABELS[r.cancelledBy] : '') },
  { key: 'brand', label: (ctx) => ctx.brandLabel, text: (r) => r.brand || '', visible: true, center: true },
  {
    key: 'location',
    label: () => "Sinov o'tkazilgan manzil",
    text: (r) => [r.location?.nameUz, r.isRepeat && 'povtor'].filter(Boolean).join(' '),
    visible: true,
  },
  { key: 'contractNo', label: () => 'Shartnoma №, (EEF)', text: (r) => r.contractNo || '', visible: true, finance: true },
  { key: 'contractDate', label: () => 'Shartnoma sanasi', text: (r) => dateText(r.contractDate), finance: true, center: true },
  {
    key: 'amount',
    label: () => 'Shartnoma summasi (EEF)',
    text: (r) => (r.amount === null || r.amount === undefined ? '' : r.amount),
    display: (r) => (r.amount === null || r.amount === undefined ? '' : formatMoney(r.amount)),
    visible: true,
    finance: true,
    sortBy: 'amount',
    sum: true,
    right: true,
  },
  { key: 'paymentStatus', label: () => "To'lov", text: (r) => (r.paymentStatus ? PAYMENT_LABELS[r.paymentStatus] : ''), finance: true },
  {
    key: 'cancelledSampleCount',
    label: () => 'Bekor qilingan namunalar',
    text: (r) => r.cancelledSampleCount || '',
    visible: true,
    sum: true,
    right: true,
  },
  { key: 'notes', label: () => 'Izoh', text: (r) => (r.notes || []).join('; '), wide: true },
  { key: 'reviewReasons', label: () => 'Tekshirish sabablari', text: (r) => (r.needsReview ? (r.reviewReasons || []).join('; ') : ''), wide: true },
  { key: 'journalYear', label: () => 'Jurnal yili', text: (r) => r.journalYear ?? '', center: true },
];

export const DEFAULT_COLUMN_KEYS = COLUMNS.filter((c) => c.visible).map((c) => c.key);

const STORAGE_KEY = 'testJournal.columns.v1';

// The viewer's own column choice, remembered in this browser only.
export function loadColumnKeys() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved.filter((k) => COLUMNS.some((c) => c.key === k));
  } catch {
    // storage unavailable — fall back to defaults
  }
  return DEFAULT_COLUMN_KEYS;
}

export function saveColumnKeys(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // storage unavailable — choice just isn't remembered
  }
}
