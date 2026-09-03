export const STATUS_LABELS = {
  LABORATORIYADA: 'Laboratoriyada',
  TASHILMOQDA: 'Tashilmoqda',
  YAKUNLANDI: 'Yakunlandi',
};

export const STATUS_STYLES = {
  LABORATORIYADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TASHILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  YAKUNLANDI: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABELS).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export const ACTION_LABELS = {
  REGISTRATSIYA: "Ro'yxatga olindi",
  CHIQARISH: 'Chiqarildi',
  QABUL_QILISH: 'Qabul qilindi',
  YAKUNLASH: 'Yakunlandi',
};

export function isOverdue(sample) {
  if (!sample.dueDate || sample.status === 'YAKUNLANDI') return false;
  return new Date(sample.dueDate) < new Date();
}
