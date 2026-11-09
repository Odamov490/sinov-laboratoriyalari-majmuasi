const crypto = require('crypto');
const prisma = require('../config/prisma');

// Faol qurilmalar (UserSession) va kirish tarixi (LoginEvent).
// Refresh token bazada faqat SHA-256 xeshi bilan saqlanadi. Token va parol
// hech qachon loglanmaydi.
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const UA_MAX = 300;

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const cleanUa = (ua) => (ua ? String(ua).slice(0, UA_MAX) : null);
// Cloudflare Tunnel + nginx ortida req.ip tunnel manzili bo'ladi; haqiqiy
// manzil CF-Connecting-IP'da. Faqat ko'rsatish uchun (xavfsizlik qarori emas).
function clientIp(req) {
  const cf = String(req.headers['cf-connecting-ip'] || '').trim();
  const ip = /^[0-9a-fA-F:.]{3,45}$/.test(cf) ? cf : req.ip || '';
  return ip.replace(/^::ffff:/, '') || null;
}

async function createSession(userId, req) {
  return prisma.userSession.create({
    data: {
      userId,
      refreshTokenHash: 'pending',
      ip: clientIp(req),
      userAgent: cleanUa(req.headers['user-agent']),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
}

const setSessionToken = (id, token) => prisma.userSession.update({ where: { id }, data: { refreshTokenHash: hashToken(token) } });

// Refresh: sessiya mavjud, bekor qilinmagan, muddati o'tmagan va token mos.
async function validateSession(sid, userId, token) {
  if (!sid) return null;
  const s = await prisma.userSession.findUnique({ where: { id: String(sid) } });
  if (!s || s.userId !== userId || s.revokedAt || s.expiresAt < new Date()) return null;
  const a = Buffer.from(s.refreshTokenHash);
  const b = Buffer.from(hashToken(token));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return s;
}

const touchSession = (id, req) =>
  prisma.userSession.update({
    where: { id },
    data: { lastUsedAt: new Date(), ip: clientIp(req), userAgent: cleanUa(req.headers['user-agent']) },
  });

const revokeSession = (id, userId) =>
  prisma.userSession.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } });

const revokeOtherSessions = (userId, exceptId) =>
  prisma.userSession.updateMany({
    where: { userId, revokedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { revokedAt: new Date() },
  });

// Faqat mavjud hisob uchun chaqiriladi (noma'lum loginlar saqlanmaydi).
const recordLogin = (userId, success, req) =>
  prisma.loginEvent
    .create({ data: { userId, success, ip: clientIp(req), userAgent: cleanUa(req.headers['user-agent']) } })
    .catch((err) => console.error(`[auth] login event not saved: ${err.code || err.name}`));

// "192.168.1.xxx" / "2001:db8:85a3:xxxx".
function maskIp(ip) {
  if (!ip) return null;
  if (ip.includes('.')) return ip.split('.').slice(0, 3).concat('xxx').join('.');
  const parts = ip.split(':').filter(Boolean);
  return `${parts.slice(0, 3).join(':')}:xxxx`;
}

// "Chrome, Windows" — oddiy regex bilan.
function deviceName(ua) {
  if (!ua) return "Noma'lum qurilma";
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /YaBrowser/.test(ua)
        ? 'Yandex'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Chrome\//.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Brauzer';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : "noma'lum tizim";
  return `${browser}, ${os}`;
}

// Har kuni: 90 kundan eski kirish yozuvlari va 30 kundan eski tugagan sessiyalar.
async function cleanupAuthHistory() {
  const old = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [events, sessions] = await Promise.all([
    prisma.loginEvent.deleteMany({ where: { createdAt: { lt: old } } }),
    prisma.userSession.deleteMany({ where: { OR: [{ revokedAt: { lt: month } }, { expiresAt: { lt: month } }] } }),
  ]);
  return { events: events.count, sessions: sessions.count };
}

// Tris: 180 kundan eski ulanish tarixi va muddati o'tgan / ishlatilgan
// OAuth state'lar (bir kundan keyin).
async function cleanupTrisHistory() {
  const old = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [events, states] = await Promise.all([
    prisma.trisConnectionEvent.deleteMany({ where: { createdAt: { lt: old } } }),
    prisma.trisOAuthState.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { lt: day } }] } }),
  ]);
  return { events: events.count, states: states.count };
}

module.exports = {
  REFRESH_TTL_MS,
  cleanupTrisHistory,
  createSession,
  setSessionToken,
  validateSession,
  touchSession,
  revokeSession,
  revokeOtherSessions,
  recordLogin,
  maskIp,
  deviceName,
  cleanupAuthHistory,
};
