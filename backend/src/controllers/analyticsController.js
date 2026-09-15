const { asyncHandler } = require('../middleware/errorHandler');

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

const CLOUDFLARE_GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

const QUERY = `
  query ($zoneTag: String!, $start: Date!, $end: Date!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequests1dGroups(
          limit: 30
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

const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } = process.env;
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    const err = new Error('Cloudflare Analytics sozlanmagan.');
    err.status = 503;
    throw err;
  }

  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json(cache.data);
  }

  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);

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
        variables: { zoneTag: CLOUDFLARE_ZONE_ID, start: toDateStr(start), end: toDateStr(end) },
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
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const totals = dailyStats.reduce(
    (acc, d) => ({
      uniqueVisitors: acc.uniqueVisitors + d.uniqueVisitors,
      pageViews: acc.pageViews + d.pageViews,
      requests: acc.requests + d.requests,
    }),
    { uniqueVisitors: 0, pageViews: 0, requests: 0 }
  );

  const data = { dailyStats, totals };
  cache = { data, fetchedAt: Date.now() };
  res.json(data);
});

module.exports = { getAnalyticsOverview };
