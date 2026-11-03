const rateLimit = require('express-rate-limit');

// Chat yo'llari bundan chiqarilgan: Cloudflare/nginx ortida hamma bitta
// IP'dek ko'rinishi mumkin; chatda foydalanuvchi bo'yicha limit bor
// (routes/chatRoutes.js, services/chat/rateLimit.js).
const isChatPath = (req) => req.path.startsWith('/api/admin/chat/') || req.path.startsWith('/api/chat/');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: isChatPath,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
});

const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p ariza yuborildi. Birozdan so'ng qayta urinib ko'ring." },
});

// Page-view beacons: a real visitor sends one per page navigation, so this
// only caps scripted inflation of the "most viewed pages" stats.
const pageViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, applicationLimiter, pageViewLimiter };
