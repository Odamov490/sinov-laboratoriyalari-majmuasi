// Namuna QR kodi: ichida skaner sahifasiga havola bo'ladi
// (https://sayt/admin/skanerlash?code=SMP-2026-00001). Telefon kamerasi bilan
// skanerlansa — to'g'ridan-to'g'ri shu namuna ochiladi; admin skanerida esa
// havoladan kod ajratib olinadi. Eski yorliqlardagi oddiy kod ham qabul qilinadi.

export const SCANNER_PATH = '/admin/skanerlash';

export function sampleQrValue(code) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${SCANNER_PATH}?code=${encodeURIComponent(code)}`;
}

const CODE_RE = /SMP-\d{4}-\d+/i;

/** QR / skaner / qo'lda kiritilgan matndan namuna kodini ajratadi. */
export function extractSampleCode(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const q = url.searchParams.get('code');
    if (q) return q.trim().toUpperCase();
  } catch {
    // URL emas — oddiy matn.
  }
  const m = raw.match(CODE_RE);
  return (m ? m[0] : raw).toUpperCase();
}
