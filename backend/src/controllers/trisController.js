// Tris integratsiyasi: bog'lash (OAuth 2.0 Authorization Code + PKCE),
// holat, tekshirish, uzish va SUPER_ADMIN boshqaruvi.
// Hech bir javobda token/refresh/secret/code/verifier bo'lmaydi.
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET, CLIENT_URL, NODE_ENV } = require('../config/env');
const { config, configSummary } = require('../config/tris');
const { asyncHandler } = require('../middleware/errorHandler');
const { encrypt, decrypt, sha256, randomToken, pkceChallenge, safeEqual } = require('../utils/trisCrypto');
const { TrisError, tokenFields, exchangeCode, fetchUserInfo, revokeToken, trisRequest } = require('../services/trisClient');

const STATE_TTL_MS = 10 * 60 * 1000;
// Brauzer bog'lovi: state shu brauzerda boshlangan bo'lishi kerak (cookie
// faqat callback yo'liga yuboriladi, JS o'qiy olmaydi).
const BIND_COOKIE = 'tris_oauth_bind';
const CALLBACK_PATH = '/api/tris/callback';
const bindCookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'lax',
  path: CALLBACK_PATH,
  maxAge: STATE_TTL_MS,
};

const ERR = (res, status, code, message) => res.status(status).json({ error: message, code });

const sendTrisError = (res, err) => {
  if (!(err instanceof TrisError)) throw err;
  const messages = {
    NOT_CONFIGURED: "Tris integratsiyasi hali sozlanmagan. Administratorga murojaat qiling.",
    NOT_CONNECTED: "Tris hisobi bog'lanmagan.",
    RECONNECT_REQUIRED: "Tris ulanishi muddati tugagan. Qayta bog'lang.",
    UNAUTHORIZED: "Tris so'rovni rad etdi (ruxsat yo'q).",
    RATE_LIMITED: "Tris juda ko'p so'rov qabul qilmayapti. Birozdan so'ng urinib ko'ring.",
    TIMEOUT: 'Tris javob bermadi (vaqt tugadi).',
    TOKEN_REJECTED: "Tris tokenni rad etdi. Qayta bog'lang.",
    INVALID_RESPONSE: "Tris'dan noto'g'ri javob keldi.",
    UPSTREAM_ERROR: 'Tris bilan aloqada xatolik.',
    INVALID_PATH: "Noto'g'ri so'rov yo'li.",
  };
  return ERR(res, err.status, err.code, messages[err.code] || 'Tris bilan aloqada xatolik.');
};

// Ulanish holati (tokenlarsiz).
function publicStatus(conn) {
  return {
    configured: config.configured,
    missing: config.missing,
    connected: Boolean(conn) && conn.status === 'ACTIVE',
    status: conn ? conn.status : null,
    connectedAt: conn?.connectedAt ?? null,
    lastUsedAt: conn?.lastUsedAt ?? null,
    accessExpiresAt: conn?.accessExpiresAt ?? null,
    trisDisplayName: conn?.trisDisplayName ?? null,
    lastErrorCode: conn?.lastErrorCode ?? null,
    pingAvailable: Boolean(config.pingPath),
  };
}

const getStatus = asyncHandler(async (req, res) => {
  const conn = await prisma.trisConnection.findUnique({ where: { userId: req.user.sub } });
  res.json(publicStatus(conn));
});

// Bog'lashni boshlash: state + PKCE; authorize manzili JSON'da qaytadi
// (XHR cross-origin 302'ni kuzata olmaydi — frontend window.location bilan o'tadi).
const connect = asyncHandler(async (req, res) => {
  if (!config.configured) return ERR(res, 503, 'NOT_CONFIGURED', 'Tris integratsiyasi hali sozlanmagan.');
  const userId = req.user.sub;
  const state = randomToken(32);
  const verifier = config.pkce ? randomToken(48) : null; // 64 belgi (RFC 7636: 43–128)
  await prisma.trisOAuthState.create({
    data: {
      stateHash: sha256(state),
      userId,
      // PKCE o'chirilgan bo'lsa ham maydon to'ldiriladi (bo'sh emas, ammo ishlatilmaydi).
      codeVerifierEnc: encrypt(verifier || '-', { purpose: 'pkce', userId }),
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    },
  });
  const url = new URL(config.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  if (config.scopes.length) url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  if (verifier) {
    url.searchParams.set('code_challenge', pkceChallenge(verifier));
    url.searchParams.set('code_challenge_method', 'S256');
  }
  res.cookie(BIND_COOKIE, state, bindCookieOptions);
  res.json({ url: url.toString() });
});

// Callback natijasi: faqat ok yoki xato + bizning qisqa sabab kodimiz.
function finish(res, ok, reason) {
  res.clearCookie(BIND_COOKIE, { ...bindCookieOptions, maxAge: undefined });
  const qs = ok ? 'tris=ok' : `tris=xato${reason ? `&sabab=${encodeURIComponent(reason)}` : ''}`;
  res.redirect(302, `${CLIENT_URL}/admin/mening-profilim?tab=integratsiyalar&${qs}`);
}

// Kirgan foydalanuvchi (cookie'dagi access token) — bo'lsa, state egasi bilan bir xil bo'lishi shart.
function cookieUserId(req) {
  const t = req.cookies?.accessToken;
  if (!t) return null;
  try {
    const p = jwt.verify(t, JWT_SECRET);
    return p.type === 'refresh' ? null : p.sub;
  } catch {
    return null;
  }
}

const event = (userId, type, detail = null) => prisma.trisConnectionEvent.create({ data: { userId, type, detail } });

// GET /api/tris/callback?code=&state= (ommaviy; himoya — state + brauzer bog'lovi).
const callback = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  if (!config.configured) return finish(res, false, 'sozlanmagan');

  const state = typeof req.query.state === 'string' ? req.query.state : null;
  const code = typeof req.query.code === 'string' ? req.query.code : null;
  const providerError = typeof req.query.error === 'string';
  if (!state || state.length > 200) return finish(res, false, 'state');

  // Bir martalik: bitta UPDATE bilan belgilanadi (atomar — ikkinchi so'rov 0 qator oladi).
  const stateHash = sha256(state);
  const now = new Date();
  const claimed = await prisma.trisOAuthState.updateMany({
    where: { stateHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) return finish(res, false, 'state');
  const row = await prisma.trisOAuthState.findUnique({ where: { stateHash } });

  // Brauzer bog'lovi: state shu brauzerda boshlangan bo'lishi kerak.
  if (!req.cookies?.[BIND_COOKIE] || !safeEqual(req.cookies[BIND_COOKIE], state)) return finish(res, false, 'state');
  const sessionUser = cookieUserId(req);
  if (sessionUser && sessionUser !== row.userId) return finish(res, false, 'state');

  if (providerError) return finish(res, false, req.query.error === 'access_denied' ? 'rad' : 'provayder');
  if (!code || code.length > 2000) return finish(res, false, 'provayder');

  const user = await prisma.user.findUnique({ where: { id: row.userId }, select: { isActive: true, deletedAt: true, mustChangePassword: true } });
  if (!user || !user.isActive || user.deletedAt || user.mustChangePassword) return finish(res, false, 'hisob');

  let verifier = null;
  if (config.pkce) {
    try {
      verifier = decrypt(row.codeVerifierEnc, { purpose: 'pkce', userId: row.userId });
    } catch {
      return finish(res, false, 'ichki');
    }
  }

  let tok;
  try {
    tok = await exchangeCode(code, verifier);
  } catch (err) {
    await event(row.userId, 'ERROR', err instanceof TrisError ? `EXCHANGE_${err.code}` : 'EXCHANGE_FAILED').catch(() => {});
    return finish(res, false, 'token');
  }

  let info = null;
  try {
    info = await fetchUserInfo(tok.access_token);
  } catch (err) {
    await event(row.userId, 'ERROR', `USERINFO_${err.code || 'FAILED'}`).catch(() => {});
    await revokeToken(tok.refresh_token || tok.access_token, tok.refresh_token ? 'refresh_token' : 'access_token');
    return finish(res, false, 'userinfo');
  }

  // Bitta tris hisobi — bitta SLM foydalanuvchisi.
  if (info) {
    const taken = await prisma.trisConnection.findUnique({ where: { trisSubject: info.subject }, select: { userId: true } });
    if (taken && taken.userId !== row.userId) {
      await event(row.userId, 'ERROR', 'SUBJECT_TAKEN').catch(() => {});
      await revokeToken(tok.refresh_token || tok.access_token, tok.refresh_token ? 'refresh_token' : 'access_token');
      return finish(res, false, 'band');
    }
  }

  const data = {
    ...tokenFields(row.userId, tok),
    status: 'ACTIVE',
    trisSubject: info?.subject ?? null,
    trisDisplayName: info?.displayName ?? null,
    connectedAt: new Date(),
    lastUsedAt: null,
    lastRefreshAt: null,
    lastErrorCode: null,
  };
  try {
    await prisma.$transaction([
      prisma.trisConnection.upsert({ where: { userId: row.userId }, create: { userId: row.userId, ...data }, update: data }),
      prisma.trisConnectionEvent.create({ data: { userId: row.userId, type: 'CONNECTED' } }),
    ]);
  } catch (err) {
    if (err.code === 'P2002') return finish(res, false, 'band');
    console.error(`[tris] save connection failed: ${err.code || err.name}`);
    return finish(res, false, 'ichki');
  }
  return finish(res, true);
});

// Uzish: avval tris'da bekor qilishga urinish, keyin tokenlar bazadan o'chiriladi.
async function removeConnection(userId, eventType) {
  const conn = await prisma.trisConnection.findUnique({ where: { userId } });
  if (!conn) return false;
  if (config.configured && config.revokeUrl) {
    let token = null;
    let hint = 'refresh_token';
    try {
      token = conn.refreshTokenEnc
        ? decrypt(conn.refreshTokenEnc, { purpose: 'refresh', userId, keyVersion: conn.keyVersion })
        : ((hint = 'access_token'), decrypt(conn.accessTokenEnc, { purpose: 'access', userId, keyVersion: conn.keyVersion }));
    } catch {
      token = null;
    }
    if (token) await revokeToken(token, hint);
  }
  await prisma.$transaction([
    prisma.trisConnection.deleteMany({ where: { userId } }),
    prisma.trisConnectionEvent.create({ data: { userId, type: eventType } }),
  ]);
  return true;
}

const disconnect = asyncHandler(async (req, res) => {
  const removed = await removeConnection(req.user.sub, 'DISCONNECTED');
  res.json({ ok: true, removed });
});

// Ulanishni tekshirish: sozlangan PING yo'liga so'rov; javob tanasi qaytmaydi.
async function ping(userId) {
  if (!config.configured) throw new TrisError('NOT_CONFIGURED');
  if (!config.pingPath) return { ok: false, code: 'PING_NOT_CONFIGURED' };
  try {
    const r = await trisRequest(userId, config.pingPath);
    return { ok: r.ok, status: r.status };
  } catch (err) {
    if (!(err instanceof TrisError)) throw err;
    return { ok: false, code: err.code, status: err.httpStatus ?? null };
  }
}

const test = asyncHandler(async (req, res) => {
  try {
    res.json(await ping(req.user.sub));
  } catch (err) {
    sendTrisError(res, err);
  }
});

// ---- SUPER_ADMIN ----

const adminConnections = asyncHandler(async (req, res) => {
  const rows = await prisma.trisConnection.findMany({
    orderBy: { connectedAt: 'desc' },
    select: {
      userId: true,
      status: true,
      connectedAt: true,
      lastUsedAt: true,
      accessExpiresAt: true,
      lastRefreshAt: true,
      lastErrorCode: true,
      trisDisplayName: true,
      user: { select: { fullName: true, email: true, role: true, lab: { select: { nameUz: true } } } },
    },
  });
  res.json({
    items: rows.map((r) => ({
      userId: r.userId,
      fullName: r.user.fullName,
      login: r.user.email,
      role: r.user.role,
      laboratory: r.user.lab?.nameUz ?? null,
      status: r.status,
      trisDisplayName: r.trisDisplayName,
      connectedAt: r.connectedAt,
      lastUsedAt: r.lastUsedAt,
      lastRefreshAt: r.lastRefreshAt,
      accessExpiresAt: r.accessExpiresAt,
      lastErrorCode: r.lastErrorCode,
    })),
  });
});

const adminDisconnect = asyncHandler(async (req, res) => {
  const removed = await removeConnection(req.params.userId, 'REVOKED_BY_ADMIN');
  if (!removed) return ERR(res, 404, 'NOT_CONNECTED', 'Ulanish topilmadi.');
  res.json({ ok: true });
});

const adminTest = asyncHandler(async (req, res) => {
  const exists = await prisma.trisConnection.findUnique({ where: { userId: req.params.userId }, select: { id: true } });
  if (!exists) return ERR(res, 404, 'NOT_CONNECTED', 'Ulanish topilmadi.');
  try {
    res.json(await ping(req.params.userId));
  } catch (err) {
    sendTrisError(res, err);
  }
});

const adminConfig = (req, res) => res.json(configSummary());

module.exports = { getStatus, connect, callback, disconnect, test, adminConnections, adminDisconnect, adminTest, adminConfig };
