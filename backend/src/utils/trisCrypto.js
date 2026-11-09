// Tris tokenlari va PKCE verifier uchun AES-256-GCM shifrlash.
// Saqlash ko'rinishi: base64(iv[12] | tag[16] | ciphertext).
// AAD (qo'shimcha autentifikatsiya ma'lumoti) maqsad va foydalanuvchiga
// bog'langan: bir foydalanuvchining shifrlangan tokenini boshqasining
// qatoriga ko'chirib bo'lmaydi (deshifr xato beradi).
// Xato xabarlarida hech qachon kalit yoki ochiq matn bo'lmaydi.
const crypto = require('crypto');
const { config } = require('../config/tris');

class TrisCryptoError extends Error {
  constructor(code) {
    super(code);
    this.name = 'TrisCryptoError';
    this.code = code;
  }
}

// Kalit versiyasi -> kalit. Hozir bitta (1); almashtirishda eski kalit shu
// yerga qo'shiladi va yozuvlar yangisiga qayta shifrlanadi.
function keyFor(version) {
  if (version === config.keyVersion && config.encryptionKey) return config.encryptionKey;
  throw new TrisCryptoError('KEY_UNAVAILABLE');
}

const aad = (purpose, userId) => Buffer.from(`slm-tris:${purpose}:${userId}`, 'utf8');

function encrypt(plain, { purpose, userId, keyVersion = config.keyVersion }) {
  if (typeof plain !== 'string' || !plain) throw new TrisCryptoError('EMPTY_VALUE');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFor(keyVersion), iv);
  cipher.setAAD(aad(purpose, userId));
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

function decrypt(stored, { purpose, userId, keyVersion = config.keyVersion }) {
  try {
    const buf = Buffer.from(stored, 'base64');
    if (buf.length < 29) throw new Error('short');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyFor(keyVersion), buf.subarray(0, 12));
    decipher.setAAD(aad(purpose, userId));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  } catch (err) {
    if (err instanceof TrisCryptoError) throw err;
    throw new TrisCryptoError('DECRYPT_FAILED');
  }
}

const sha256 = (v) => crypto.createHash('sha256').update(v, 'utf8').digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
// PKCE S256: BASE64URL(SHA256(verifier)).
const pkceChallenge = (verifier) => crypto.createHash('sha256').update(verifier, 'ascii').digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { encrypt, decrypt, sha256, randomToken, pkceChallenge, safeEqual, TrisCryptoError };
