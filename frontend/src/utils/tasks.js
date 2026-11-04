import { tr, dateLocale } from '../i18n/tr.js';
// Vazifalar menejeri uchun umumiy yorliqlar va ranglar.

export const TASK_STATUSES = [
  { value: 'YANGI', label: tr('Yangi'), color: 'bg-slate-100 text-slate-700', column: 'border-slate-300' },
  { value: 'JARAYONDA', label: tr('Jarayonda'), color: 'bg-blue-100 text-blue-700', column: 'border-blue-300' },
  { value: 'TEKSHIRUVDA', label: tr('Tekshiruvda'), color: 'bg-amber-100 text-amber-700', column: 'border-amber-300' },
  { value: 'BAJARILDI', label: tr('Bajarildi'), color: 'bg-emerald-100 text-emerald-700', column: 'border-emerald-300' },
  { value: 'BEKOR_QILINDI', label: tr('Bekor qilindi'), color: 'bg-gray-100 text-gray-500', column: 'border-gray-300' },
];

export const TASK_PRIORITIES = [
  { value: 'PAST', label: tr('Past'), color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  { value: 'ORTACHA', label: tr("O'rtacha"), color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  { value: 'YUQORI', label: tr('Yuqori'), color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'SHOSHILINCH', label: tr('Shoshilinch'), color: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
];

export const TASK_RELATED_TYPES = [
  { value: 'ARIZA', label: tr('Ariza') },
  { value: 'NAMUNA', label: tr('Namuna') },
  { value: 'NOMUVOFIQLIK', label: tr('Nomuvofiqlik') },
  { value: 'JURNAL', label: tr('Sinov jurnali') },
  { value: 'BOSHQA', label: tr('Boshqa') },
];

const byValue = (list) => Object.fromEntries(list.map((x) => [x.value, x]));
export const STATUS_BY = byValue(TASK_STATUSES);
export const PRIORITY_BY = byValue(TASK_PRIORITIES);
export const RELATED_BY = byValue(TASK_RELATED_TYPES);

// "2026-11-03" -> "3-noy, 2026"
export const formatDue = (ymd) =>
  ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const formatDateTime = (v) => (v ? new Date(v).toLocaleString(dateLocale(), { dateStyle: 'medium', timeStyle: 'short' }) : '');

// Boshqa joylardagi hisoblagich va ro'yxatlarni yangilash uchun.
export const notifyTasksChanged = () => {
  window.dispatchEvent(new Event('tasks:changed'));
  window.dispatchEvent(new Event('notifications:changed'));
};

export const apiError = (err) => err?.response?.data?.error || tr('Xatolik yuz berdi.');
