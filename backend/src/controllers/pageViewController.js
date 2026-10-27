const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseRange } = require('./analyticsController');

const MAX_PATH_LENGTH = 200;
const DEFAULT_TOP_LIMIT = 10;
const MAX_TOP_LIMIT = 50;

// Normalizes a client-reported path to "/a/b" (no query/hash, no trailing
// slash); returns null for anything that isn't a public site page.
function normalizePath(raw) {
  if (typeof raw !== 'string') return null;
  let path = raw.split(/[?#]/)[0].trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.length > MAX_PATH_LENGTH) return null;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (path === '/admin' || path.startsWith('/admin/')) return null;
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  return path;
}

// POST /api/page-view { path } — one public page view (sent by the frontend on
// every route change). Counted per UTC day; ON CONFLICT keeps concurrent
// views of the same page from racing on the insert.
const recordPageView = asyncHandler(async (req, res) => {
  const path = normalizePath(req.body?.path);
  if (!path) return res.status(204).send();

  await prisma.$executeRaw`
    INSERT INTO "PageViewDaily" ("date", "path", "views")
    VALUES ((now() AT TIME ZONE 'UTC')::date, ${path}, 1)
    ON CONFLICT ("date", "path") DO UPDATE SET "views" = "PageViewDaily"."views" + 1
  `;
  res.status(204).send();
});

// GET /api/admin/analytics/top-pages?start&end&limit — most viewed pages in
// the range, plus the range total so the UI can show each page's share.
const getTopPages = asyncHandler(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_TOP_LIMIT, 1), MAX_TOP_LIMIT);
  const where = { date: { gte: new Date(start), lte: new Date(end) } };

  const [grouped, total] = await Promise.all([
    prisma.pageViewDaily.groupBy({
      by: ['path'],
      where,
      _sum: { views: true },
      orderBy: { _sum: { views: 'desc' } },
      take: limit,
    }),
    prisma.pageViewDaily.aggregate({ where, _sum: { views: true } }),
  ]);

  res.json({
    range: { start, end },
    totalViews: total._sum.views || 0,
    pages: grouped.map((g) => ({ path: g.path, views: g._sum.views || 0 })),
  });
});

module.exports = { recordPageView, getTopPages };
