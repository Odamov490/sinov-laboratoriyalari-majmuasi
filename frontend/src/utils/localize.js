const SUFFIX = { uz: 'Uz', ru: 'Ru', en: 'En' };

// Reads a multilingual field like nameUz/nameRu/nameEn given base "name" and current lang.
export function getLocalized(obj, base, lang) {
  if (!obj) return '';
  const suffix = SUFFIX[lang] || SUFFIX.uz;
  const key = `${base}${suffix}`;
  return obj[key] ?? obj[`${base}Uz`] ?? '';
}

export function formatDate(dateStr, lang = 'uz') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatPrice(amount, currency = 'UZS') {
  if (amount === null || amount === undefined) return null;
  const n = Number(amount);
  return `${n.toLocaleString('uz-UZ')} ${currency}`;
}
