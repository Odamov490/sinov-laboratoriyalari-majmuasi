// Bosh sahifa "hero" blokining fon rasmlari (slayder).
// SiteSetting: hero_slides — JSON massiv (["/uploads/a.jpg", ...]),
//              hero_slide_interval — sekundlarda (3..30, standart 6).

export const MAX_HERO_SLIDES = 10;
export const DEFAULT_HERO_INTERVAL = 6;

// Faqat o'zimizga yuklangan rasm manzillari qabul qilinadi
// (CSS/HTML ichiga begona qiymat tushmasligi uchun).
const SAFE_URL = /^\/uploads\/[\w.-]+\.(jpe?g|png|webp)$/i;

export function parseHeroSlides(value) {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return [];
    return arr.filter((u) => typeof u === 'string' && SAFE_URL.test(u)).slice(0, MAX_HERO_SLIDES);
  } catch {
    return [];
  }
}

export function parseHeroInterval(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_HERO_INTERVAL;
  return Math.min(30, Math.max(3, Math.round(n)));
}

export const isHeroImageFile = (file) => /\.(jpe?g|png|webp)$/i.test(file?.name || '');
