import React from 'react';
import { RESULT_LABELS, resultOptions, directionShort, PAYMENT_LABELS, CANCELLED_BY_LABELS, formatDate, formatMoney } from './journalConstants';
import { tr, currentLang } from '../../../i18n/tr.js';

// Columns of the journal table, in the paper/Excel journal's order. The same
// list drives the on-screen table and the Excel export, so a new column is
// one entry here.
//   label(ctx)   header text (ctx.brandLabel depends on the open sheet)
//   text(r)      plain value — shown in the cell and written to Excel
//   render(r,c)  optional custom cell (in-table editing)
//   finance      only for roles that see money fields
//   sum          summed in the JAMI row; sortBy enables header sorting

const dateText = (v) => (v ? formatDate(v) : '');

export const resultText = (r) =>
  (RESULT_LABELS[r.result] || r.result) +
  (r.result === 'QISMAN_MOS_EMAS' && r.nonconformingCount ? (' ' + tr('({0} ta)', r.nonconformingCount)) : '');

// Qator ranglari — har bir natija o'z rangida (Excel eksportda ham xuddi shu
// ranglar: excelExport.RESULT_FILLS; hisobot belgilari: RESULT_STYLES).
export const ROW_COLORS = {
  MOS: 'bg-green-200', // muvofiq — yashil
  MOS_EMAS: 'bg-red-300', // nomuvofiq — qizil
  QISMAN_MOS_EMAS: 'bg-orange-200', // qisman nomuvofiq — to'q sariq
  KORIB_CHIQISH: 'bg-violet-200', // ko'rib chiqish kerak — binafsha
  NAMUNA_TAQDIM_ETILMADI: 'bg-yellow-200', // namuna taqdim etilmadi — sariq
  BEKOR_QILINDI: 'bg-slate-300', // bekor qilindi — kulrang
  KUTILMOQDA: 'bg-sky-100', // natija kutilmoqda — och ko'k
};

const inlineInput =
  'w-full min-w-[7.5rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-[13px] hover:border-slate-400 focus:border-primary focus:bg-white focus:outline-none';

// Sana katagi: doim ko'rinadigan kalendar (Bayonnoma sanasi kabi). Kalendardan
// tanlanganda yoki yil to'liq yozilganda saqlanadi; tozalansa — bo'sh.
const isFullDate = (v) => v === '' || /^(19|20)\d\d-\d\d-\d\d$/.test(v);
function dateCell(field, label, { get = (r) => r[field], payload } = {}) {
  return (r, ctx) => {
    const value = get(r) ? String(get(r)).slice(0, 10) : '';
    return (
      <input
        key={`${r.id}:${field}:${value}`}
        type="date"
        defaultValue={value}
        disabled={ctx.savingCell === `${r.id}:${field}`}
        onChange={(e) => {
          const v = e.target.value;
          if (isFullDate(v) && v !== value) ctx.saveCell(r, field, v, payload ? payload(r, v || null) : undefined);
        }}
        className={inlineInput}
        aria-label={label()}
      />
    );
  };
}

export const COLUMNS = [
  { key: 'productType', label: () => tr('Mahsulot turi'), text: (r) => r.productType?.nameUz || '' },
  {
    key: 'certificationBody',
    label: () => tr('Sertifikatlashtirish idorasi nomi'),
    text: (r) => r.certificationBody?.name || '',
    wide: true,
  },
  { key: 'actNo', label: () => tr('Namuna tanlash dalolatnomasi raqami ID'), text: (r) => r.actNo || '', sortBy: 'actNo', center: true },
  {
    key: 'actDate',
    label: () => tr('Namuna tanlash dalolatnomasi sanasi'),
    text: (r) => dateText(r.actDate),
    sortBy: 'actDate',
    center: true,
    render: dateCell('actDate', () => tr('Namuna tanlash dalolatnomasi sanasi')),
  },
  { key: 'executorName', label: () => tr('Namuna tanlash dalolatnomasi F.I.Sh'), text: (r) => r.executorName || '', center: true },
  {
    key: 'sampleReceivedDate',
    label: () => tr('Namuna kelgan sanasi'),
    text: (r) => dateText(r.sampleReceivedDate),
    sortBy: 'sampleReceivedDate',
    center: true,
    render: dateCell('sampleReceivedDate', () => tr('Namuna kelgan sanasi')),
  },
  { key: 'sampleReceivedTime', label: () => tr('Namuna kelgan vaqti'), text: (r) => r.sampleReceivedTime || '', center: true },
  { key: 'sampleCount', label: () => tr('Namuna(lar) soni'), text: (r) => r.sampleCount ?? '', sortBy: 'sampleCount', sum: true, center: true },
  { key: 'weightNote', label: () => tr("Og'irligi"), text: (r) => r.weightNote || '', center: true },
  {
    key: 'protocolDate',
    label: () => tr('Bayonnoma sanasi'),
    text: (r) => dateText(r.protocolDate),
    sortBy: 'protocolDate',
    center: true,
    render: dateCell('protocolDate', () => tr('Bayonnoma sanasi')),
  },
  {
    key: 'directions',
    label: () => tr("Sinov o'tkazilishi kerak bo'lgan yo'nalish (BZ, EMM, EE)"),
    text: (r) => (r.directions || []).map(directionShort).join('+'),
    center: true,
  },
  {
    key: 'result',
    label: () => tr('Natija'),
    text: resultText,
    render: (r, ctx) => (
      <select
        value={r.result}
        disabled={ctx.savingCell === `${r.id}:result`}
        onChange={(e) => ctx.saveCell(r, 'result', e.target.value)}
        className={`${inlineInput} cursor-pointer`}
        // Eng uzun holat nomi (joriy tilda) to'liq sig'ishi uchun: matn + strelka joyi.
        style={{ minWidth: `${Math.max(...resultOptions(r.result).map((o) => o.label.length), resultText(r).length) + 4}ch` }}
        aria-label={tr('Natija')}
      >
        {resultOptions(r.result).map(({ value, label }) => (
          <option key={value} value={value}>
            {value === r.result ? resultText(r) : label}
          </option>
        ))}
      </select>
    ),
  },
  { key: 'nonconformingCount', label: () => tr('Nomuvofiq namunalar soni'), text: (r) => r.nonconformingCount ?? '', center: true },
  { key: 'cancelledBy', label: () => tr('Bekor qilgan tomon'), text: (r) => (r.cancelledBy ? CANCELLED_BY_LABELS[r.cancelledBy] : '') },
  { key: 'brand', label: (ctx) => ctx.brandLabel, text: (r) => r.brand || '', center: true },
  {
    key: 'location',
    label: () => tr("Sinov o'tkazilgan manzil"),
    text: (r) => [r.location?.nameUz, r.isRepeat && 'povtor'].filter(Boolean).join(' '),
  },
  { key: 'contractNo', label: () => tr('Shartnoma №, (EEF)'), text: (r) => r.contractNo || '', finance: true },
  {
    key: 'contractDate',
    label: () => tr('Shartnoma sanasi'),
    text: (r) => dateText(r.contractDate),
    finance: true,
    center: true,
    render: dateCell('contractDate', () => tr('Shartnoma sanasi')),
  },
  {
    key: 'amount',
    label: () => tr('Shartnoma summasi (EEF)'),
    text: (r) => (r.amount === null || r.amount === undefined ? '' : r.amount),
    display: (r) => (r.amount === null || r.amount === undefined ? '' : formatMoney(r.amount)),
    finance: true,
    sortBy: 'amount',
    sum: true,
    right: true,
  },
  { key: 'paymentStatus', label: () => tr("To'lov"), text: (r) => (r.paymentStatus ? PAYMENT_LABELS[r.paymentStatus] : ''), finance: true },
  {
    key: 'cancelledSampleCount',
    label: () => tr('Bekor qilingan namunalar'),
    text: (r) => r.cancelledSampleCount || '',
    sum: true,
    right: true,
  },
  { key: 'notes', label: () => tr('Izoh'), text: (r) => (r.notes || []).join('; '), wide: true },
  { key: 'reviewReasons', label: () => tr('Tekshirish sabablari'), text: (r) => (r.needsReview ? (r.reviewReasons || []).join('; ') : ''), wide: true },
  { key: 'journalYear', label: () => tr('Jurnal yili'), text: (r) => r.journalYear ?? '', center: true },
];

export const CUSTOM_TYPES = { text: tr('Matn'), number: tr('Son'), date: tr('Sana') };

const customText = (type, value) => {
  if (value === null || value === undefined || value === '') return '';
  return type === 'date' ? formatDate(value) : value;
};

// SUPER_ADMIN bergan ustun nomi joriy interfeys tilida (labels[til]).
// Asosiy ustun: shu tilda nom berilmagan bo'lsa — null (lug'atdagi tarjima
// ishlaydi); eski (tilsiz) `label` o'zbekcha nom hisoblanadi.
// Qo'shimcha ustun: shu tilda bo'lmasa — o'zbekcha / asosiy nomi.
export function layoutLabel(entry, lang = currentLang()) {
  const own = entry?.labels?.[lang];
  if (own) return own;
  if (entry?.custom) return entry.labels?.uz || entry.label || entry.key;
  if (lang === 'uz') return entry?.label || null;
  return null;
}

// Column definition for a SUPER_ADMIN-defined extra column; its values live
// in record.customFields[key].
export function customColumn(entry) {
  return {
    key: entry.key,
    custom: true,
    type: entry.type || 'text',
    label: () => layoutLabel(entry),
    text: (r) => customText(entry.type, r.customFields?.[entry.key]),
    // "Sana" turidagi qo'shimcha ustun ham kalendar bilan (qiymat customFields ichida).
    ...(entry.type === 'date' && {
      render: dateCell(entry.key, () => layoutLabel(entry), {
        get: (r) => r.customFields?.[entry.key],
        payload: (r, v) => ({ customFields: { ...(r.customFields || {}), [entry.key]: v } }),
      }),
    }),
    center: entry.type === 'date',
    right: entry.type === 'number',
  };
}

// The shared table layout (order, hidden flags, extra columns) resolved into
// column definitions. Without a saved layout: every built-in column in code
// order. Built-in columns added to the code later are appended visible.
export function resolveColumns(layout, showFinance = true) {
  const builtin = new Map(COLUMNS.map((c) => [c.key, c]));
  const entries = layout?.length ? layout : COLUMNS.map((c) => ({ key: c.key }));
  const seen = new Set();
  const out = [];
  entries.forEach((e) => {
    const col = e.custom ? customColumn(e) : builtin.get(e.key);
    if (!col || seen.has(e.key)) return;
    seen.add(e.key);
    // O'chirilgan asosiy ustun ro'yxatda qoladi (qayta qo'shilib ketmasligi uchun), lekin ko'rsatilmaydi.
    if (e.removed) return;
    // Asosiy ustunga SUPER_ADMIN bergan nom (joriy til uchun).
    const own = e.custom ? null : layoutLabel(e);
    const label = own ? () => own : col.label;
    out.push({ ...col, label, hidden: Boolean(e.hidden) });
  });
  COLUMNS.forEach((c) => {
    if (!seen.has(c.key)) out.push({ ...c, hidden: false });
  });
  return out.filter((c) => !c.finance || showFinance);
}
