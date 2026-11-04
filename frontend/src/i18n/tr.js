// Admin panel tarjimasi: o'zbekcha matnning o'zi kalit (gettext uslubi).
//   tr("Saqlash")                         -> "Сохранить" (ru) / "Save" (en)
//   tr("{0} ta fayl yuklandi.", n)        -> o'rinlar {0}, {1}... bilan
// Lug'atda topilmasa o'zbekcha matn qaytadi, ya'ni hech narsa buzilmaydi.
// Lug'atlar: ./admin/ru.json, ./admin/en.json (kalit = o'zbekcha matn).
//
// Modul darajasidagi konstantalar (menyu, ustunlar) yuklanishda bir marta
// hisoblanadi, shuning uchun admin panelda til almashtirilganda sahifa qayta
// yuklanadi (LanguageSwitcher -> changeAdminLanguage).
import i18n from './index.js';
import ru from './admin/ru.json';
import en from './admin/en.json';

const DICTS = { ru, en };
export const ADMIN_LANGS = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

function storedLang() {
  try {
    return localStorage.getItem('slm_lang');
  } catch {
    return null;
  }
}

export function currentLang() {
  const l = String(i18n.language || storedLang() || 'uz').slice(0, 2);
  return DICTS[l] || l === 'uz' ? l : 'uz';
}

// Bazadagi ko'p tilli nom: nameRu/nameEn bo'lmasa nameUz. obj yo'q bo'lsa undefined
// (shunda `locName(x) || '—'` ishlayveradi).
const SUFFIX = { uz: 'Uz', ru: 'Ru', en: 'En' };
export function locName(obj, base = 'name') {
  if (!obj) return undefined;
  return obj[`${base}${SUFFIX[currentLang()]}`] || obj[`${base}Uz`];
}

// Sahifa yuklangandagi til: modul konstantalari shu tilda hisoblangan.
export const LOADED_LANG = currentLang();

const fill = (s, args) => (args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[i] === undefined || args[i] === null ? '' : String(args[i]))) : s);

export function tr(text, ...args) {
  const d = DICTS[currentLang()];
  const v = d ? d[text] : undefined;
  return fill(v === undefined ? text : v, args);
}

// Serverdan kelgan (o'zgaruvchan qismli) xabarlar: aniq moslik, keyin
// "{0}" li kalitlar bo'yicha andoza. Noma'lum xabar o'zgarishsiz qaytadi.
let patterns = null;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function buildPatterns(d) {
  return Object.keys(d)
    .filter((k) => /\{\d+\}/.test(k))
    .map((k) => {
      const order = [];
      const src = k
        .split(/(\{\d+\})/)
        .map((part) => {
          const m = /^\{(\d+)\}$/.exec(part);
          if (!m) return escapeRe(part);
          order.push(Number(m[1]));
          return '(.+?)';
        })
        .join('');
      return { key: k, re: new RegExp(`^${src}$`, 's'), order };
    })
    .sort((a, b) => b.key.length - a.key.length);
}
export function trServer(text) {
  if (typeof text !== 'string' || !text) return text;
  const d = DICTS[currentLang()];
  if (!d) return text;
  if (d[text] !== undefined) return d[text];
  if (!patterns) patterns = buildPatterns(d);
  for (const p of patterns) {
    const m = p.re.exec(text);
    if (!m) continue;
    const args = [];
    p.order.forEach((idx, i) => {
      args[idx] = trServer(m[i + 1]);
    });
    return fill(d[p.key], args);
  }
  return text;
}

const DATE_LOCALES = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' };
export const dateLocale = () => DATE_LOCALES[currentLang()] || 'uz-UZ';

// Til almashtirish: saqlanadi va sahifa qayta yuklanadi (yuqoridagi izohga qarang).
export function changeAdminLanguage(code) {
  if (code === currentLang()) return;
  i18n.changeLanguage(code).finally(() => window.location.reload());
}
