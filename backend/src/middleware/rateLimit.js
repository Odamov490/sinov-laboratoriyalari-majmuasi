const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
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

module.exports = { generalLimiter, authLimiter, applicationLimiter };
