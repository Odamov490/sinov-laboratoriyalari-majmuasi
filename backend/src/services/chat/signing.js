const crypto = require('crypto');
const { JWT_SECRET } = require('../../config/env');

// Chat media uchun qisqa muddatli imzolangan havolalar. Kalit JWT_SECRET'dan
// HKDF orqali olinadi (alohida maxfiy qiymat kerak emas). Imzo foydalanuvchi
// + fayl + variant + muddatga bog'langan; endpoint har so'rovda imzoni VA
// a'zolikni qayta tekshiradi.
const KEY = Buffer.from(crypto.hkdfSync('sha256', Buffer.from(String(JWT_SECRET)), Buffer.alloc(0), Buffer.from('slm-chat-media-v1'), 32));
const TTL_SEC = 30 * 60;
// Muddat 5 daqiqalik bo'laklarga yaxlitlanadi: shu oraliqda havola o'zgarmaydi
// va brauzer keshi ishlaydi.
const BUCKET_SEC = 5 * 60;
const VARIANTS = ['full', 'thumb', 'sticker'];

function signature(variant, id, userId, exp) {
  return crypto.createHmac('sha256', KEY).update(`${variant}:${id}:${userId}:${exp}`).digest('base64url');
}

function mediaUrl(userId, id, variant = 'full', ttlSec = TTL_SEC) {
  const now = Math.floor(Date.now() / 1000);
  const exp = Math.ceil((now + ttlSec) / BUCKET_SEC) * BUCKET_SEC;
  const s = signature(variant, id, userId, exp);
  return `/api/chat/media/${id}?v=${variant}&u=${encodeURIComponent(userId)}&e=${exp}&s=${s}`;
}

// { ok, userId, variant } | { ok:false, status }
function verify(id, query) {
  const variant = String(query.v || 'full');
  const userId = String(query.u || '');
  const exp = Number(query.e);
  const sig = String(query.s || '');
  if (!VARIANTS.includes(variant) || !userId || !Number.isInteger(exp) || !sig) return { ok: false, status: 403 };
  if (exp < Math.floor(Date.now() / 1000)) return { ok: false, status: 410 };
  const expected = Buffer.from(signature(variant, id, userId, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return { ok: false, status: 403 };
  return { ok: true, userId, variant, exp };
}

module.exports = { mediaUrl, verify, TTL_SEC };
