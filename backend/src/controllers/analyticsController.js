const { asyncHandler } = require('../middleware/errorHandler');

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_RANGE_DAYS = 366;
// Keyed by "start|end" — an admin picking different date ranges shouldn't
// share one cache slot, but each exact range is still cheap to re-serve.
const cache = new Map();

const CLOUDFLARE_GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const QUERY = `
  query ($zoneTag: String!, $start: Date!, $end: Date!, $limit: Int!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequests1dGroups(
          limit: $limit
          filter: { date_geq: $start, date_leq: $end }
          orderBy: [date_ASC]
        ) {
          dimensions { date }
          sum { requests pageViews bytes cachedRequests }
          uniq { uniques }
        }
      }
    }
  }
`;

const toDateStr = (d) => d.toISOString().slice(0, 10);
const daysBetween = (start, end) => Math.round((end - start) / 86400000) + 1;

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.fetchedAt >= CACHE_TTL_MS) cache.delete(key);
  }
}

function parseRange(query) {
  const today = toDateStr(new Date());
  const { start, end } = query;

  if (!start && !end) {
    const defaultStart = new Date();
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);
    return { start: toDateStr(defaultStart), end: today };
  }

  if (!DATE_RE.test(start || '') || !DATE_RE.test(end || '')) {
    const err = new Error('start/end sanalari YYYY-MM-DD formatida bo\'lishi kerak.');
    err.status = 400;
    throw err;
  }
  if (start > end) {
    const err = new Error('start sanasi end sanasidan katta bo\'lishi mumkin emas.');
    err.status = 400;
    throw err;
  }
  const cappedEnd = end > today ? today : end;
  if (daysBetween(new Date(start), new Date(cappedEnd)) > MAX_RANGE_DAYS) {
    const err = new Error(`Oraliq ${MAX_RANGE_DAYS} kundan oshmasligi kerak.`);
    err.status = 400;
    throw err;
  }
  return { start, end: cappedEnd };
}

const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } = process.env;
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    const err = new Error('Cloudflare Analytics sozlanmagan.');
    err.status = 503;
    throw err;
  }

  const { start, end } = parseRange(req.query);
  const cacheKey = `${start}|${end}`;

  pruneCache();
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached.data);

  const limit = Math.min(daysBetween(new Date(start), new Date(end)), MAX_RANGE_DAYS);

  let response;
  try {
    response = await fetch(CLOUDFLARE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { zoneTag: CLOUDFLARE_ZONE_ID, start, end, limit },
      }),
    });
  } catch (fetchErr) {
    console.error('Cloudflare Analytics: fetch failed', fetchErr);
    const err = new Error('Cloudflare Analytics xizmatiga ulanib bo\'lmadi.');
    err.status = 502;
    throw err;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || payload.errors?.length) {
    console.error('Cloudflare Analytics API error:', response.status, JSON.stringify(payload));
    const err = new Error('Cloudflare Analytics ma\'lumotlarini olishda xatolik yuz berdi.');
    err.status = 502;
    throw err;
  }

  const groups = payload.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

  const dailyStats = groups
    .map((g) => ({
      date: g.dimensions.date,
      uniqueVisitors: g.uniq.uniques,
      pageViews: g.sum.pageViews,
      requests: g.sum.requests,
      cachedRequests: g.sum.cachedRequests,
      bytes: g.sum.bytes,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const totals = dailyStats.reduce(
    (acc, d) => ({
      uniqueVisitors: acc.uniqueVisitors + d.uniqueVisitors,
      pageViews: acc.pageViews + d.pageViews,
      requests: acc.requests + d.requests,
      cachedRequests: acc.cachedRequests + d.cachedRequests,
      bytes: acc.bytes + d.bytes,
    }),
    { uniqueVisitors: 0, pageViews: 0, requests: 0, cachedRequests: 0, bytes: 0 }
  );

  const data = { range: { start, end }, dailyStats, totals };
  cache.set(cacheKey, { data, fetchedAt: Date.now() });
  res.json(data);
});

module.exports = { getAnalyticsOverview };
