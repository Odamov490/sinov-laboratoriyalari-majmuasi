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
