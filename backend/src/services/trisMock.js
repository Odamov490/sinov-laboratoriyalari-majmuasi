// SOXTA tris OAuth provayderi — FAQAT ishlab chiqish va sinash uchun.
// app.js uni faqat TRIS_OAUTH_MOCK=true VA NODE_ENV !== 'production'
// bo'lganda ulaydi. Holat xotirada (qayta ishga tushganda yo'qoladi).
// Butun oqimni real tris'siz sinash imkonini beradi: bog'lash, PKCE,
// redirect_uri tekshiruvi, yangilash (aylantirish bilan), eskirish,
// bekor qilish, rad etish.
const crypto = require('crypto');
const express = require('express');
const { config } = require('../config/tris');

const codes = new Map(); // code -> { redirectUri, challenge, subject, name, exp }
const access = new Map(); // token -> { subject, exp }
const refresh = new Map(); // token -> { subject, name }
const users = new Map(); // subject -> name
const settings = { accessTtl: 120, failRefresh: false, refreshDelayMs: 0 };
const stats = { tokenCalls: 0, refreshCalls: 0, pings: 0 };

const rnd = () => crypto.randomBytes(24).toString('base64url');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const now = () => Date.now();

function page(title, body) {
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>body{font-family:system-ui,sans-serif;background:#f1f5f9;display:flex;justify-content:center;padding:40px 16px}
.c{background:#fff;border-radius:12px;padding:28px;max-width:420px;width:100%;box-shadow:0 4px 20px #0001}
h1{font-size:20px;margin:0 0 6px}p{color:#475569;font-size:14px}.w{background:#fef3c7;color:#92400e;padding:8px 10px;border-radius:8px;font-size:12px}
input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin:4px 0 12px}
button{padding:10px 16px;border-radius:8px;border:0;font-weight:600;cursor:pointer;margin-right:8px}.a{background:#1d4ed8;color:#fff}.d{background:#e2e8f0}</style></head>
<body><div class="c">${body}</div></body></html>`;
}

// Mijozni tekshirish (Basic yoki POST tanasi).
function clientOk(req) {
  let id = req.body.client_id;
  let secret = req.body.client_secret;
  const h = req.headers.authorization || '';
  if (h.startsWith('Basic ')) {
    const [u, p] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
    id = decodeURIComponent(u || '');
    secret = decodeURIComponent(p || '');
  }
  if (id !== config.clientId) return false;
  if (config.authMethod === 'none') return true;
  return secret === config.clientSecret;
}

function issue(subject, name) {
  const at = rnd();
  const rt = rnd();
  access.set(at, { subject, exp: now() + settings.accessTtl * 1000 });
  refresh.set(rt, { subject, name });
  return { access_token: at, token_type: 'Bearer', expires_in: settings.accessTtl, refresh_token: rt, scope: config.scopes.join(' ') || 'mock' };
}

const bearer = (req) => {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  const rec = t && access.get(t);
  return rec && rec.exp > now() ? rec : null;
};

function buildMockRouter() {
  const r = express.Router();
  r.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  r.get('/authorize', (req, res) => {
    const q = req.query;
    // Ro'yxatdan o'tgan redirect_uri'dan farq qilsa — yo'naltirmasdan rad etiladi.
    if (q.redirect_uri !== config.redirectUri) return res.status(400).send(page('Xato', '<h1>redirect_uri mos emas</h1>'));
    if (q.client_id !== config.clientId || q.response_type !== 'code') return res.status(400).send(page('Xato', '<h1>Noto‘g‘ri so‘rov</h1>'));
    if (config.pkce && (!q.code_challenge || q.code_challenge_method !== 'S256')) return res.status(400).send(page('Xato', '<h1>PKCE talab qilinadi</h1>'));
    const hidden = ['redirect_uri', 'state', 'code_challenge']
      .map((k) => `<input type="hidden" name="${k}" value="${esc(q[k])}">`)
      .join('');
    res.send(
      page(
        'Tris (soxta)',
        `<h1>Tris — soxta kirish</h1><p class="w">Bu ishlab chiqish uchun SOXTA provayder. Real tris emas.</p>
<form method="post">${hidden}<label>Tris foydalanuvchi nomi<input name="subject" value="mock.user" required></label>
<label>Ko‘rinadigan ism<input name="name" value="Soxta Foydalanuvchi"></label>
<p>SLM ilovasi tris hisobingizdan cheklangan foydalanishni so‘ramoqda.</p>
<button class="a" name="decision" value="allow">Ruxsat beraman</button><button class="d" name="decision" value="deny">Rad etaman</button></form>`
      )
    );
  });

  r.post('/authorize', (req, res) => {
    const { redirect_uri: redirectUri, state, code_challenge: challenge, decision, subject, name } = req.body;
    if (redirectUri !== config.redirectUri) return res.status(400).send(page('Xato', '<h1>redirect_uri mos emas</h1>'));
    const back = new URL(redirectUri);
    if (state) back.searchParams.set('state', state);
    if (decision !== 'allow') {
      back.searchParams.set('error', 'access_denied');
      return res.redirect(302, back.toString());
    }
    const code = rnd();
    const sub = String(subject || 'mock.user').slice(0, 100);
    users.set(sub, String(name || sub).slice(0, 100));
    codes.set(code, { redirectUri, challenge, subject: sub, exp: now() + 60_000 });
    back.searchParams.set('code', code);
    res.redirect(302, back.toString());
  });

  r.post('/token', async (req, res) => {
    stats.tokenCalls += 1;
    if (!clientOk(req)) return res.status(401).json({ error: 'invalid_client' });
    const b = req.body;
    if (b.grant_type === 'authorization_code') {
      const c = codes.get(b.code);
      codes.delete(b.code); // bir martalik
      if (!c || c.exp < now()) return res.status(400).json({ error: 'invalid_grant' });
      if (b.redirect_uri !== c.redirectUri) return res.status(400).json({ error: 'invalid_grant' });
      if (config.pkce) {
        const calc = b.code_verifier ? crypto.createHash('sha256').update(String(b.code_verifier)).digest('base64url') : '';
        if (calc !== c.challenge) return res.status(400).json({ error: 'invalid_grant' });
      }
      return res.json(issue(c.subject, users.get(c.subject)));
    }
    if (b.grant_type === 'refresh_token') {
      stats.refreshCalls += 1;
      if (settings.refreshDelayMs) await new Promise((ok) => setTimeout(ok, settings.refreshDelayMs));
      const rec = refresh.get(b.refresh_token);
      if (!rec || settings.failRefresh) return res.status(400).json({ error: 'invalid_grant' });
      refresh.delete(b.refresh_token); // aylantirish: eski refresh endi yaroqsiz
      return res.json(issue(rec.subject, rec.name));
    }
    return res.status(400).json({ error: 'unsupported_grant_type' });
  });

  r.post('/revoke', (req, res) => {
    if (!clientOk(req)) return res.status(401).json({ error: 'invalid_client' });
    const t = req.body.token;
    const rec = refresh.get(t);
    refresh.delete(t);
    access.delete(t);
    // Refresh bekor qilinsa — shu hisobning access tokenlari ham.
    if (rec) [...access].forEach(([k, v]) => v.subject === rec.subject && access.delete(k));
    res.status(200).end();
  });

  r.get('/userinfo', (req, res) => {
    const rec = bearer(req);
    if (!rec) return res.status(401).json({ error: 'invalid_token' });
    res.json({ sub: rec.subject, name: users.get(rec.subject) || rec.subject });
  });

  // Soxta API: yengil tekshiruv yo'li.
  r.get('/api/ping', (req, res) => {
    stats.pings += 1;
    if (!bearer(req)) return res.status(401).json({ error: 'invalid_token' });
    res.json({ ok: true });
  });

  // Sinov boshqaruvi (faqat mock): token muddati, refresh rad etilishi,
  // hamma access tokenlarni eskirtirish, hisoblagichlar.
  r.post('/_control', express.json(), (req, res) => {
    const b = req.body || {};
    if (Number.isFinite(b.accessTtl)) settings.accessTtl = Math.max(1, b.accessTtl);
    if (typeof b.failRefresh === 'boolean') settings.failRefresh = b.failRefresh;
    if (Number.isFinite(b.refreshDelayMs)) settings.refreshDelayMs = b.refreshDelayMs;
    if (b.expireAccess) access.clear();
    if (b.resetStats) Object.keys(stats).forEach((k) => (stats[k] = 0));
    res.json({ settings, stats, refreshTokens: refresh.size });
  });

  return r;
}

module.exports = { buildMockRouter };
