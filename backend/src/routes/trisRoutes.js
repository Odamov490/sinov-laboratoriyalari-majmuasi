// /api/tris — ommaviy (autentifikatsiyasiz) qism: OAuth callback va
// (faqat ishlab chiqishda) soxta provayder. Foydalanuvchi va SUPER_ADMIN
// endpointlari adminRoutes.js'da (/api/admin/profile/tris, /api/admin/tris).
const express = require('express');
const rateLimit = require('express-rate-limit');
const { config } = require('../config/tris');
const tris = require('../controllers/trisController');

const router = express.Router();

const callbackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
});

router.get('/callback', callbackLimiter, tris.callback);

if (config.mock) {
  // eslint-disable-next-line global-require
  router.use('/mock', require('../services/trisMock').buildMockRouter());
}

module.exports = router;
