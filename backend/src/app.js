const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const { PORT, CLIENT_URL, NODE_ENV, UPLOAD_DIR } = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { generateSitemap } = require('./controllers/sitemapController');
const { startTaskReminders } = require('./services/taskReminders');
const { syncAllMemberships } = require('./services/chat/membership');
const { seedStarterPack } = require('./services/chat/stickers');
const { startChatCleanup } = require('./services/chat/cleanup');
const { startAuthCleanup } = require('./services/authCleanup');
const { initChatSocket } = require('./socket/chatSocket');
const chatMediaRoutes = require('./routes/chatMediaRoutes');

const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trisRoutes = require('./routes/trisRoutes');
const { config: trisConfig } = require('./config/tris');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// /api/tris/* (OAuth callback: ?code=&state=, mock) — URL so'rov parametrlari
// logga yozilmaydi (bir martalik kod/state maxfiy hisoblanadi).
morgan.token('url', (req) => {
  const url = req.originalUrl || req.url;
  return url.startsWith('/api/tris/') ? url.split('?')[0] : url;
});
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Mounted before the rate limiter so search-engine crawlers refetching
// the sitemap never get throttled alongside real user API traffic.
app.get('/sitemap.xml', generateSitemap);

app.use(generalLimiter);

// Static uploaded files
app.use('/uploads', express.static(path.resolve(process.cwd(), UPLOAD_DIR)));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// Tris OAuth callback (ommaviy; himoya — bir martalik state).
app.use('/api/tris', trisRoutes);
// Chat media: imzolangan havola bilan (cookie talab qilinmaydi).
app.use('/api/chat', chatMediaRoutes);
app.use('/api', publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO shu HTTP serverga ulanadi (/socket.io — Express'dan oldin,
// shuning uchun IP limitiga tushmaydi).
const server = http.createServer(app);
initChatSocket(server);

server.listen(PORT, () => {
  console.log(`SLM backend running on port ${PORT} [${NODE_ENV}]`);
  // Tris: faqat holat va yetishmayotgan sozlama NOMLARI (qiymatlar hech qachon).
  if (trisConfig.mockRequested && !trisConfig.mock) {
    console.warn("[tris] WARNING: TRIS_OAUTH_MOCK=true production muhitida e'tiborsiz qoldirildi — soxta provayder yuklanmadi.");
  }
  if (trisConfig.mock) console.warn('[tris] SOXTA provayder yoqilgan (/api/tris/mock) — faqat ishlab chiqish uchun.');
  console.log(
    trisConfig.configured ? '[tris] integration: configured' : `[tris] integration: not configured (missing: ${trisConfig.missing.join(', ')})`
  );
  startTaskReminders();
  // Chat tizim xonalari a'zoligini hisoblar holatiga moslash.
  syncAllMemberships()
    .then((n) => console.log(`[chat] membership sync: ${n} users`))
    .catch((err) => console.error(`[chat] membership sync failed: ${err.code || err.name}`));
  seedStarterPack()
    .then((seeded) => seeded && console.log('[chat] starter sticker pack created'))
    .catch((err) => console.error(`[chat] sticker seed failed: ${err.code || err.name}`));
  startChatCleanup();
  startAuthCleanup();
});

module.exports = app;
