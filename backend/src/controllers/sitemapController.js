const prisma = require('../config/prisma');
const { CLIENT_URL } = require('../config/env');
const { asyncHandler } = require('../middleware/errorHandler');

// Static, always-indexable pages. Transactional/action pages (submit an
// application, track an application) are intentionally excluded — they
// have no unique crawlable content and shouldn't consume crawl budget.
const STATIC_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/biz-haqimizda', priority: '0.6', changefreq: 'monthly' },
  { path: '/laboratoriyalar', priority: '0.9', changefreq: 'weekly' },
  { path: '/xizmatlar', priority: '0.9', changefreq: 'weekly' },
  { path: '/narxlar', priority: '0.7', changefreq: 'weekly' },
  { path: '/standartlar', priority: '0.6', changefreq: 'monthly' },
  { path: '/akkreditatsiya', priority: '0.7', changefreq: 'monthly' },
  { path: '/yangiliklar', priority: '0.8', changefreq: 'daily' },
  { path: '/hujjatlar', priority: '0.6', changefreq: 'monthly' },
  { path: '/mutaxassislar', priority: '0.5', changefreq: 'monthly' },
  { path: '/uskunalar', priority: '0.6', changefreq: 'monthly' },
  { path: '/galereya', priority: '0.5', changefreq: 'weekly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/tnved-tekshirish', priority: '0.7', changefreq: 'monthly' },
  { path: '/aloqa', priority: '0.5', changefreq: 'yearly' },
];

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(base, path, lastmod, priority, changefreq) {
  const loc = xmlEscape(`${base}${path}`);
  const lastmodTag = lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// Mirrors the same isActive/isPublished/deletedAt filtering the public
// list/detail controllers use, so the sitemap never links a page that
// would 404 for a crawler.
const generateSitemap = asyncHandler(async (req, res) => {
  const base = CLIENT_URL.replace(/\/$/, '');

  const [labs, services, news, equipment] = await Promise.all([
    prisma.laboratory.findMany({ where: { isActive: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({ where: { isActive: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.news.findMany({ where: { isPublished: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.equipment.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } }),
  ]);

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(base, p.path, null, p.priority, p.changefreq)),
    ...labs.map((l) => urlEntry(base, `/laboratoriyalar/${l.slug}`, l.updatedAt, '0.7', 'monthly')),
    ...services.map((s) => urlEntry(base, `/xizmatlar/${s.slug}`, s.updatedAt, '0.7', 'monthly')),
    ...news.map((n) => urlEntry(base, `/yangiliklar/${n.slug}`, n.updatedAt, '0.6', 'weekly')),
    ...equipment.map((e) => urlEntry(base, `/uskunalar/${e.slug}`, e.updatedAt, '0.5', 'monthly')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

module.exports = { generateSitemap };
