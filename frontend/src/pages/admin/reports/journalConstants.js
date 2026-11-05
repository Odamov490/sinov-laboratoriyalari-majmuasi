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

export const RESULT_STYLES = {
  MOS: 'bg-emerald-100 text-emerald-700',
  MOS_EMAS: 'bg-red-100 text-red-700',
  QISMAN_MOS_EMAS: 'bg-orange-100 text-orange-700',
  NAMUNA_TAQDIM_ETILMADI: 'bg-slate-100 text-slate-600',
  BEKOR_QILINDI: 'bg-slate-200 text-slate-600',
  KUTILMOQDA: 'bg-sky-100 text-sky-700',
  KORIB_CHIQISH: 'bg-amber-100 text-amber-800',
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

// Unit price for a record: same product type and test kind (SHOVQIN or the
// main BZ/EMM/EE tests), latest price whose validFrom is on/before the act
// date (or today). Returns null when the price list has no match.
export function findUnitPrice(prices, { productTypeId, directions, actDate }) {
  if (!productTypeId) return null;
  const kind = (directions || []).includes('SHOVQIN') ? 'SHOVQIN' : null;
  const onDate = actDate || new Date().toISOString().slice(0, 10);
  const match = prices
    .filter((p) => p.productTypeId === productTypeId && (p.direction || null) === kind)
    .filter((p) => String(p.validFrom).slice(0, 10) <= onDate)
    .sort((a, b) => String(b.validFrom).localeCompare(String(a.validFrom)))[0];
  return match ? Number(match.unitPrice) : null;
}

// Field names shown in the change history.
export const FIELD_LABELS = {
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
