import { tr } from '../../../i18n/tr.js';
// Shared labels/styles for the test journal (Hisobot) — enums mirror the
// backend (prisma TestDirection / JournalResult / JournalPayment).

export const RESULT_LABELS = {
  MOS: tr('Muvofiq'),
  MOS_EMAS: tr('Nomuvofiq'),
  // Endi tanlanmaydi; faqat eski yozuvlarni ko'rsatish uchun qoldirilgan.
  QISMAN_MOS_EMAS: tr('Qisman nomuvofiq'),
  NAMUNA_TAQDIM_ETILMADI: tr('Namuna taqdim etilmadi'),
  BEKOR_QILINDI: tr('Bekor qilindi'),
  KUTILMOQDA: tr('Natija kutilmoqda'),
  KORIB_CHIQISH: tr("Ko'rib chiqish kerak"),
};

// Tanlov ro'yxatlari uchun (QISMAN_MOS_EMAS olib tashlangan). Yozuvning joriy
// qiymati ro'yxatda bo'lmasa (eski yozuv), u ham qo'shiladi — ko'rinib tursin.
const RETIRED_RESULTS = new Set(['QISMAN_MOS_EMAS']);
export const resultOptions = (current) =>
  Object.entries(RESULT_LABELS)
    .filter(([value]) => !RETIRED_RESULTS.has(value) || value === current)
    .map(([value, label]) => ({ value, label }));

// Hisobot belgilari — jadval qatorlari bilan bir xil rang oilasi (ROW_COLORS).
export const RESULT_STYLES = {
  MOS: 'bg-green-200 text-green-900',
  MOS_EMAS: 'bg-red-300 text-red-900',
  QISMAN_MOS_EMAS: 'bg-orange-200 text-orange-900',
  NAMUNA_TAQDIM_ETILMADI: 'bg-yellow-200 text-yellow-900',
  BEKOR_QILINDI: 'bg-slate-300 text-slate-800',
  KUTILMOQDA: 'bg-sky-100 text-sky-900',
  KORIB_CHIQISH: 'bg-violet-200 text-violet-900',
};

// Sinov yo'nalishlari — Spravochniklar > "Sinov yo'nalishlari" dan keladi
// (AdminReports yuklab, setDirectionTypes bilan o'rnatadi). Yuklanguncha —
// dastlabki 4 tasi. Nomlar tr() orqali (bazadagi o'zbekcha nom kalit bo'ladi).
const DEFAULT_DIRECTION_TYPES = [
  { code: 'XAVFSIZLIK', short: 'BZ', nameUz: 'Xavfsizlik (BZ)', isActive: true },
  { code: 'EMC', short: 'EMM', nameUz: 'Elektromagnit moslashuvchanlik (EMM)', isActive: true },
  { code: 'ENERGIYA', short: 'EE', nameUz: 'Energiya samaradorligi (EE)', isActive: true },
  { code: 'SHOVQIN', short: 'Shovqin', nameUz: 'Shovqin darajasi', isActive: true },
];
let directionTypes = DEFAULT_DIRECTION_TYPES;

export function setDirectionTypes(list) {
  if (Array.isArray(list) && list.length) directionTypes = list;
}

// Jadval/Excel/tarixdagi qisqa nomi (BZ, EMM, ...); noma'lum kod — o'zi.
export function directionShort(code) {
  const d = directionTypes.find((x) => x.code === code);
  return d ? tr(d.short) : code;
}

// To'liq nomi va spravochnikdagi tartibi (hisobot uchun).
export function directionName(code) {
  const d = directionTypes.find((x) => x.code === code);
  return d ? tr(d.nameUz) : code;
}
export function directionOrder(code) {
  const i = directionTypes.findIndex((x) => x.code === code);
  return i === -1 ? 999 : i;
}

// Tanlov uchun: faol yo'nalishlar + yozuvda allaqachon belgilangan nofaollari.
export function directionOptions(selected = []) {
  return directionTypes
    .filter((d) => d.isActive !== false || selected.includes(d.code))
    .map((d) => ({ value: d.code, short: tr(d.short), label: tr(d.nameUz) }));
}

// Yangi yozuv uchun standart belgilanganlar (asosiy sinovlar, mavjud bo'lsa).
export const defaultDirections = () =>
  ['XAVFSIZLIK', 'EMC', 'ENERGIYA'].filter((c) => directionTypes.some((d) => d.code === c && d.isActive !== false));

export const PAYMENT_LABELS = { TOLANGAN: tr("To'langan"), TOLANMAGAN: tr("To'lanmagan") };

export const CANCELLED_BY_LABELS = { ARIZACHI: tr('Ariza beruvchi'), ORGAN: tr('Organ') };

export const formatMoney = (value) =>
  value === null || value === undefined ? '—' : Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

// "2026-01-08" -> "08.01.2026"
export const formatDate = (value) => {
  if (!value) return '—';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

// Roles that see and enter amount/contract/payment (mirrors backend
// FINANCE_ROLES in testJournalController).
export const FINANCE_ROLES = ['SUPER_ADMIN', 'MANAGER'];


// Yo'nalishlar bo'yicha natija (2+ yo'nalishli yozuv): saqlangan qiymat yoki
// hali kiritilmagan bo'lsa — umumiy natija. null = bitta umumiy natija.
export function directionResultsOf(r) {
  const dirs = r?.directions || [];
  if (dirs.length < 2) return null;
  const saved = r.directionResults || {};
  return Object.fromEntries(dirs.map((d) => [d, saved[d] || r.result || 'KUTILMOQDA']));
}

// Matn ko'rinishi: hammasi bir xil bo'lsa — bitta nom, aks holda "EE: Muvofiq; EMM: Nomuvofiq".
export function directionResultsText(map) {
  if (!map) return '';
  const values = Object.values(map);
  if (values.every((v) => v === values[0])) return RESULT_LABELS[values[0]] || values[0];
  return Object.entries(map)
    .map(([d, v]) => `${directionShort(d)}: ${RESULT_LABELS[v] || v}`)
    .join('; ');
}

// Field names shown in the change history.
export const FIELD_LABELS = {
  directionResults: tr("Yo'nalishlar bo'yicha natija"),
  journalYear: tr('Jurnal yili'),
  productTypeId: tr('Mahsulot turi'),
  certificationBodyId: tr('Buyurtmachi'),
  actNo: tr('Akt ID'),
  actDate: tr('Akt sanasi'),
  executorName: tr('Ijrochi'),
  sampleReceivedDate: tr('Namuna kelgan sana'),
  sampleReceivedTime: tr('Namuna kelgan vaqt'),
  sampleCount: tr('Namunalar soni'),
  cancelledSampleCount: tr('Bekor qilingan namunalar'),
  weightNote: tr("Og'irlik"),
  protocolDate: tr('Bayonnoma sanasi'),
  directions: tr("Yo'nalishlar"),
  result: tr('Natija'),
  nonconformingCount: tr('Nomuvofiq namunalar'),
  cancelledBy: tr('Bekor qilgan tomon'),
  brand: tr('Marka'),
  locationId: tr('Joy'),
  isRepeat: tr('Takroriy'),
  contractNo: tr('Shartnoma'),
  contractDate: tr('Shartnoma sanasi'),
  amount: tr('Summa'),
  paymentStatus: tr("To'lov"),
  notes: tr('Izohlar'),
  needsReview: tr('Tekshirish kerak'),
  reviewReasons: tr('Tekshirish sabablari'),
};
