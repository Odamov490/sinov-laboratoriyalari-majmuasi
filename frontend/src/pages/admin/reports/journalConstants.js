// Shared labels/styles for the test journal (Hisobot) — enums mirror the
// backend (prisma TestDirection / JournalResult / JournalPayment).

export const RESULT_LABELS = {
  MOS: 'Mos',
  MOS_EMAS: 'Mos emas',
  QISMAN_MOS_EMAS: 'Qisman mos emas',
  NAMUNA_TAQDIM_ETILMADI: 'Namuna taqdim etilmadi',
  BEKOR_QILINDI: 'Bekor qilindi',
  KUTILMOQDA: 'Natija kutilmoqda',
  KORIB_CHIQISH: "Ko'rib chiqish kerak",
};

export const RESULT_STYLES = {
  MOS: 'bg-emerald-100 text-emerald-700',
  MOS_EMAS: 'bg-red-100 text-red-700',
  QISMAN_MOS_EMAS: 'bg-orange-100 text-orange-700',
  NAMUNA_TAQDIM_ETILMADI: 'bg-slate-100 text-slate-600',
  BEKOR_QILINDI: 'bg-slate-200 text-slate-600',
  KUTILMOQDA: 'bg-sky-100 text-sky-700',
  KORIB_CHIQISH: 'bg-amber-100 text-amber-800',
};

export const DIRECTIONS = [
  { value: 'XAVFSIZLIK', short: 'BZ', label: 'Xavfsizlik (BZ)' },
  { value: 'EMC', short: 'EMM', label: 'Elektromagnit moslashuvchanlik (EMM)' },
  { value: 'ENERGIYA', short: 'EE', label: 'Energiya samaradorligi (EE)' },
  { value: 'SHOVQIN', short: 'Shovqin', label: 'Shovqin darajasi' },
];

export const DIRECTION_SHORT = Object.fromEntries(DIRECTIONS.map((d) => [d.value, d.short]));

export const PAYMENT_LABELS = { TOLANGAN: "To'langan", TOLANMAGAN: "To'lanmagan" };

export const CANCELLED_BY_LABELS = { ARIZACHI: 'Ariza beruvchi', ORGAN: 'Organ' };

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
  journalYear: 'Jurnal yili',
  productTypeId: 'Mahsulot turi',
  certificationBodyId: 'Buyurtmachi',
  actNo: 'Akt ID',
  actDate: 'Akt sanasi',
  executorName: 'Ijrochi',
  sampleReceivedDate: 'Namuna kelgan sana',
  sampleReceivedTime: 'Namuna kelgan vaqt',
  sampleCount: 'Namunalar soni',
  cancelledSampleCount: 'Bekor qilingan namunalar',
  weightNote: "Og'irlik",
  protocolDate: 'Bayonnoma sanasi',
  directions: "Yo'nalishlar",
  result: 'Natija',
  nonconformingCount: 'Mos emas namunalar',
  cancelledBy: 'Bekor qilgan tomon',
  brand: 'Marka',
  locationId: 'Joy',
  isRepeat: 'Takroriy',
  contractNo: 'Shartnoma',
  contractDate: 'Shartnoma sanasi',
  amount: 'Summa',
  paymentStatus: "To'lov",
  notes: 'Izohlar',
  needsReview: 'Tekshirish kerak',
  reviewReasons: 'Tekshirish sabablari',
};
