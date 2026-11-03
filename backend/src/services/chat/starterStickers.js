// Boshlang'ich stikerlar to'plami: shu loyiha uchun chizilgan oddiy vektor
// personaj ("Kolbacha" — dumaloq laboratoriya kolbasi) va o'zbekcha yozuv.
// Hech qanday mavjud personaj yoki mualliflik huquqi bilan himoyalangan
// tasvir ishlatilmagan. Tashqi havola, skript, shrift yuklanmaydi.

const EYES = {
  dot: '<circle cx="206" cy="268" r="17" fill="#1f2937"/><circle cx="306" cy="268" r="17" fill="#1f2937"/><circle cx="211" cy="262" r="5" fill="#fff"/><circle cx="311" cy="262" r="5" fill="#fff"/>',
  happy: '<path d="M186 272 q20 -26 40 0" stroke="#1f2937" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M286 272 q20 -26 40 0" stroke="#1f2937" stroke-width="11" fill="none" stroke-linecap="round"/>',
  wink: '<circle cx="206" cy="268" r="17" fill="#1f2937"/><circle cx="211" cy="262" r="5" fill="#fff"/><path d="M286 270 q20 -20 40 0" stroke="#1f2937" stroke-width="11" fill="none" stroke-linecap="round"/>',
  closed: '<path d="M188 266 q18 16 36 0" stroke="#1f2937" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M288 266 q18 16 36 0" stroke="#1f2937" stroke-width="10" fill="none" stroke-linecap="round"/>',
  big: '<circle cx="206" cy="266" r="24" fill="#1f2937"/><circle cx="306" cy="266" r="24" fill="#1f2937"/><circle cx="214" cy="256" r="8" fill="#fff"/><circle cx="314" cy="256" r="8" fill="#fff"/><circle cx="200" cy="274" r="4" fill="#fff"/><circle cx="300" cy="274" r="4" fill="#fff"/>',
  sad: '<circle cx="206" cy="272" r="15" fill="#1f2937"/><circle cx="306" cy="272" r="15" fill="#1f2937"/><path d="M184 242 l40 12" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/><path d="M328 242 l-40 12" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/>',
  stars: '<path d="M206 246 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2z" fill="#1f2937"/><path d="M306 246 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2z" fill="#1f2937"/>',
};

const MOUTHS = {
  smile: '<path d="M226 312 q30 30 60 0" stroke="#1f2937" stroke-width="10" fill="none" stroke-linecap="round"/>',
  open: '<path d="M222 306 q34 52 68 0 z" fill="#1f2937"/><path d="M238 326 q18 12 36 0" fill="#f87171"/>',
  flat: '<path d="M232 318 h48" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/>',
  o: '<ellipse cx="256" cy="320" rx="14" ry="17" fill="#1f2937"/>',
  sad: '<path d="M228 328 q28 -24 56 0" stroke="#1f2937" stroke-width="10" fill="none" stroke-linecap="round"/>',
  tongue: '<path d="M224 308 q32 34 64 0" stroke="#1f2937" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M250 322 q12 22 24 0" fill="#f87171"/>',
};

const ACCENTS = {
  heart: '<path d="M402 120 c-14 -24 -50 -14 -46 14 c3 20 30 34 46 48 c16 -14 43 -28 46 -48 c4 -28 -32 -38 -46 -14z" fill="#ef4444"/>',
  check: '<circle cx="408" cy="132" r="44" fill="#16a34a"/><path d="M386 132 l16 16 30 -32" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  clock: '<circle cx="408" cy="132" r="44" fill="#fff" stroke="#1f2937" stroke-width="8"/><path d="M408 104 v30 l20 12" stroke="#1f2937" stroke-width="8" fill="none" stroke-linecap="round"/>',
  hourglass: '<path d="M380 88 h56 M380 176 h56 M386 92 q0 34 22 40 q-22 6 -22 40 M430 92 q0 34 -22 40 q22 6 22 40" stroke="#1f2937" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M394 162 q14 -16 28 0z" fill="#f59e0b"/>',
  sparkle: '<path d="M408 84 l10 34 34 10 -34 10 -10 34 -10 -34 -34 -10 34 -10z" fill="#facc15"/><path d="M116 120 l6 18 18 6 -18 6 -6 18 -6 -18 -18 -6 18 -6z" fill="#facc15"/>',
  hand: '<g transform="rotate(-18 410 140)"><rect x="384" y="104" width="52" height="64" rx="22" fill="#fde68a" stroke="#1f2937" stroke-width="6"/><path d="M392 106 v-26 M406 104 v-34 M420 104 v-30 M432 110 v-20" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/></g><path d="M454 92 q14 20 0 40 M470 84 q20 28 0 56" stroke="#1f2937" stroke-width="6" fill="none" stroke-linecap="round"/>',
  thumb: '<rect x="380" y="118" width="58" height="52" rx="16" fill="#fde68a" stroke="#1f2937" stroke-width="6"/><path d="M394 120 q-4 -36 18 -42 q10 0 8 16 l-4 26" fill="#fde68a" stroke="#1f2937" stroke-width="6" stroke-linejoin="round"/>',
  bulb: '<circle cx="408" cy="124" r="32" fill="#fde047" stroke="#1f2937" stroke-width="6"/><rect x="394" y="154" width="28" height="18" rx="4" fill="#9ca3af" stroke="#1f2937" stroke-width="6"/><path d="M366 92 l-12 -10 M450 92 l12 -10 M408 80 v-14" stroke="#1f2937" stroke-width="6" stroke-linecap="round"/>',
  drop: '<path d="M148 210 q-14 22 0 32 q14 -10 0 -32z" fill="#60a5fa"/>',
  flag: '<path d="M388 70 v110" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/><path d="M392 74 h56 l-14 20 14 20 h-56z" fill="#22c55e" stroke="#1f2937" stroke-width="5" stroke-linejoin="round"/>',
};

function sticker({ text, color, dark, eyes, mouth, accent, cheeks = true }) {
  const fontSize = text.length > 11 ? 42 : text.length > 8 ? 50 : 58;
  const bannerW = Math.min(460, Math.max(220, text.length * fontSize * 0.62 + 60));
  const bx = 256 - bannerW / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<path d="M214 70 h84 v22 h-12 v74 c62 22 106 80 106 146 c0 86 -72 140 -136 140 s-136 -54 -136 -140 c0 -66 44 -124 106 -146 v-74 h-12z" fill="${color}" stroke="${dark}" stroke-width="12" stroke-linejoin="round"/>
<path d="M150 330 c40 26 172 26 212 0 c4 70 -46 116 -106 116 s-110 -46 -106 -116z" fill="${dark}" opacity="0.22"/>
<rect x="222" y="96" width="14" height="52" rx="7" fill="#fff" opacity="0.55"/>
${EYES[eyes]}
${MOUTHS[mouth]}
${cheeks ? '<ellipse cx="176" cy="306" rx="18" ry="11" fill="#fb7185" opacity="0.55"/><ellipse cx="336" cy="306" rx="18" ry="11" fill="#fb7185" opacity="0.55"/>' : ''}
${accent ? ACCENTS[accent] : ''}
<rect x="${bx}" y="404" width="${bannerW}" height="84" rx="26" fill="#fff" stroke="${dark}" stroke-width="8"/>
<text x="256" y="${446 + fontSize * 0.34}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="#1f2937">${text}</text>
</svg>`;
}

const STARTER_STICKERS = [
  { emoji: '🙏', svg: sticker({ text: 'Rahmat', color: '#f9a8d4', dark: '#be185d', eyes: 'happy', mouth: 'smile', accent: 'heart' }) },
  { emoji: '👍', svg: sticker({ text: 'Yaxshi', color: '#86efac', dark: '#15803d', eyes: 'dot', mouth: 'smile', accent: 'thumb' }) },
  { emoji: '💡', svg: sticker({ text: 'Tushundim', color: '#93c5fd', dark: '#1d4ed8', eyes: 'dot', mouth: 'o', accent: 'bulb' }) },
  { emoji: '⏱️', svg: sticker({ text: 'Hozir', color: '#fdba74', dark: '#c2410c', eyes: 'big', mouth: 'flat', accent: 'clock' }) },
  { emoji: '⏳', svg: sticker({ text: 'Kutaman', color: '#c4b5fd', dark: '#6d28d9', eyes: 'closed', mouth: 'flat', accent: 'hourglass' }) },
  { emoji: '🤩', svg: sticker({ text: 'Ajoyib', color: '#fde047', dark: '#a16207', eyes: 'stars', mouth: 'open', accent: 'sparkle' }) },
  { emoji: '🥺', svg: sticker({ text: 'Iltimos', color: '#5eead4', dark: '#0f766e', eyes: 'big', mouth: 'o', accent: 'drop' }) },
  { emoji: '👋', svg: sticker({ text: 'Xayr', color: '#7dd3fc', dark: '#0369a1', eyes: 'wink', mouth: 'smile', accent: 'hand' }) },
  { emoji: '😊', svg: sticker({ text: 'Salom', color: '#bef264', dark: '#4d7c0f', eyes: 'happy', mouth: 'open', accent: 'hand' }) },
  { emoji: '✅', svg: sticker({ text: 'Qabul qilindi', color: '#6ee7b7', dark: '#047857', eyes: 'dot', mouth: 'smile', accent: 'check' }) },
  { emoji: '🏁', svg: sticker({ text: 'Tayyor', color: '#a5b4fc', dark: '#4338ca', eyes: 'wink', mouth: 'tongue', accent: 'flag' }) },
  { emoji: '😔', svg: sticker({ text: 'Kechirasiz', color: '#cbd5e1', dark: '#475569', eyes: 'sad', mouth: 'sad', accent: 'drop', cheeks: false }) },
];

module.exports = { STARTER_STICKERS };
