// Tris bilan ishlash qatlami: OAuth token almashinuvi, yangilash (qulf bilan),
// bekor qilish, userinfo va umumiy trisRequest().
//
// Xavfsizlik qoidalari (bu fayldagi hamma funksiyalar uchun):
//  - token, refresh token, client secret, code, code_verifier hech qachon
//    logga, xato xabariga, API javobiga yoki URL'ga tushmaydi;
//  - so'rov/javob tanasi va URL so'rov parametrlari log qilinmaydi;
//  - tashqi xatolar TrisError'ga aylantiriladi: unda faqat qisqa kod bor
//    (asl fetch xatosi "cause" bilan ham uzatilmaydi);
//  - trisRequest faqat TRIS_API_BASE_URL ostidagi yo'llarga boradi (SSRF),
//    yo'naltirishlarga (3xx) ergashmaydi.
const prisma = require('../config/prisma');
const { config } = require('../config/tris');
const { encrypt, decrypt, TrisCryptoError } = require('../utils/trisCrypto');
const { notifyUsers } = require('./inAppNotifications');

const TOKEN_TIMEOUT_MS = 10_000;
const API_TIMEOUT_MS = 15_000;
const REFRESH_MARGIN_MS = 60_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_RETRIES = 2;
const PROFILE_LINK = '/admin/mening-profilim?tab=integratsiyalar';

// Xato kodlari (foydalanuvchiga va logga faqat shular chiqadi).
const HTTP_FOR = {
  NOT_CONFIGURED: 503,
  NOT_CONNECTED: 409,
  RECONNECT_REQUIRED: 409,
  UNAUTHORIZED: 502,
  RATE_LIMITED: 503,
  UPSTREAM_ERROR: 502,
  TIMEOUT: 504,
  TOKEN_REJECTED: 502,
  INVALID_RESPONSE: 502,
  INVALID_PATH: 400,
};

class TrisError extends Error {
  constructor(code, extra = {}) {
    super(`TRIS_${code}`);
    this.name = 'TrisError';
    this.code = code;
    this.status = HTTP_FOR[code] || 502;
    // Faqat xavfsiz qo'shimcha: OAuth xato kodi (masalan invalid_grant) — format tekshirilgan.
    if (extra.oauthError && /^[a-z_]{1,40}$/.test(extra.oauthError)) this.oauthError = extra.oauthError;
    if (extra.httpStatus) this.httpStatus = extra.httpStatus;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Bitta HTTP chaqiruv: timeout butun javobni (tanasi bilan) qamraydi.
async function httpCall(url, init, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, redirect: 'manual' });
    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_BODY_BYTES) {
      ctrl.abort();
      throw new TrisError('INVALID_RESPONSE');
    }
    const text = await res.text();
    if (text.length > MAX_BODY_BYTES) throw new TrisError('INVALID_RESPONSE');
    return { status: res.status, headers: res.headers, text };
  } catch (err) {
    if (err instanceof TrisError) throw err;
    // Asl xato (unda manzil bo'lishi mumkin) tashqariga chiqmaydi.
    throw new TrisError(err?.name === 'AbortError' ? 'TIMEOUT' : 'UPSTREAM_ERROR');
  } finally {
    clearTimeout(timer);
  }
}

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Mijoz autentifikatsiyasi sozlangan usulda (RFC 6749 2.3.1).
function withClientAuth(params) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
  const body = new URLSearchParams(params);
  if (config.authMethod === 'client_secret_basic') {
    const id = encodeURIComponent(config.clientId);
    const secret = encodeURIComponent(config.clientSecret);
    headers.Authorization = `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
  } else {
    body.set('client_id', config.clientId);
    if (config.authMethod === 'client_secret_post') body.set('client_secret', config.clientSecret);
  }
  return { headers, body: body.toString() };
}

async function tokenRequest(params) {
  if (!config.configured) throw new TrisError('NOT_CONFIGURED');
  const res = await httpCall(config.tokenUrl, { method: 'POST', ...withClientAuth(params) }, TOKEN_TIMEOUT_MS);
  const json = parseJson(res.text);
  if (res.status >= 200 && res.status < 300) {
    if (!json || typeof json.access_token !== 'string' || !json.access_token) throw new TrisError('INVALID_RESPONSE');
    if (json.token_type && String(json.token_type).toLowerCase() !== 'bearer') throw new TrisError('INVALID_RESPONSE');
    return json;
  }
  if (res.status === 400 || res.status === 401) throw new TrisError('TOKEN_REJECTED', { oauthError: json?.error, httpStatus: res.status });
  if (res.status === 429) throw new TrisError('RATE_LIMITED', { httpStatus: res.status });
  throw new TrisError('UPSTREAM_ERROR', { httpStatus: res.status });
}

// Token javobidan bazaga yoziladigan maydonlar (shifrlangan).
function tokenFields(userId, tok, keepRefreshEnc = null) {
  const expiresIn = Number(tok.expires_in);
  return {
    accessTokenEnc: encrypt(tok.access_token, { purpose: 'access', userId }),
    // Provayder yangi refresh bermasa — eskisi qoladi (aylantirilmaydigan refresh).
    refreshTokenEnc:
      typeof tok.refresh_token === 'string' && tok.refresh_token ? encrypt(tok.refresh_token, { purpose: 'refresh', userId }) : keepRefreshEnc,
    keyVersion: config.keyVersion,
    tokenType: 'Bearer',
    scope: typeof tok.scope === 'string' ? tok.scope.slice(0, 1000) : null,
    accessExpiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null,
  };
}

// Authorization code -> tokenlar (callback'da).
const exchangeCode = (code, codeVerifier) =>
  tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

// userinfo: faqat sub va ko'rinadigan ism olinadi (id_token ishlatilmaydi).
async function fetchUserInfo(accessToken) {
  if (!config.userinfoUrl) return null;
  const res = await httpCall(
    config.userinfoUrl,
    { method: 'GET', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } },
    TOKEN_TIMEOUT_MS
  );
  if (res.status < 200 || res.status >= 300) throw new TrisError(res.status === 401 ? 'UNAUTHORIZED' : 'UPSTREAM_ERROR', { httpStatus: res.status });
  const json = parseJson(res.text);
  const sub = json?.sub ?? json?.id ?? json?.user_id;
  if (sub === undefined || sub === null || String(sub).length === 0 || String(sub).length > 200) throw new TrisError('INVALID_RESPONSE');
  const name = json.name || json.full_name || json.preferred_username || json.username || null;
  return { subject: String(sub), displayName: name ? String(name).slice(0, 200) : null };
}

// Tris'da tokenni bekor qilish (RFC 7009). Xato bo'lsa — jim davom etadi.
async function revokeToken(token, hint) {
  if (!config.revokeUrl || !token || !config.configured) return false;
  try {
    const res = await httpCall(config.revokeUrl, { method: 'POST', ...withClientAuth({ token, token_type_hint: hint }) }, TOKEN_TIMEOUT_MS);
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

const isFresh = (c) => !c.accessExpiresAt || c.accessExpiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS;
const decryptField = (c, field, purpose) => decrypt(c[field], { purpose, userId: c.userId, keyVersion: c.keyVersion });

// Ulanish yaroqsiz deb belgilanadi (tokenlar o'chirilmaydi — qayta bog'langanda almashadi).
async function markExpired(db, userId, code) {
  await db.trisConnection.update({ where: { userId }, data: { status: 'EXPIRED', lastErrorCode: code } });
  await db.trisConnectionEvent.create({ data: { userId, type: 'REFRESH_FAILED', detail: code } });
}

// Bir vaqtda bitta yangilash: qator FOR UPDATE bilan qulflanadi; qulfdan
// keyin qayta o'qiladi — boshqa so'rov allaqachon yangilagan bo'lsa, o'sha
// token qaytariladi (refresh token aylantirilganda ikkinchi yangilash eski
// refresh bilan rad etilardi).
async function refreshLocked(userId, rejectedEnc) {
  const outcome = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "TrisConnection" WHERE "userId" = ${userId} FOR UPDATE`;
      const c = await tx.trisConnection.findUnique({ where: { userId } });
      if (!c) return { kind: 'fail', code: 'NOT_CONNECTED' };
      if (c.status !== 'ACTIVE') return { kind: 'fail', code: 'RECONNECT_REQUIRED' };
      if (isFresh(c) && c.accessTokenEnc !== rejectedEnc) return { kind: 'ok', conn: c };
      if (!c.refreshTokenEnc) {
        await markExpired(tx, userId, 'NO_REFRESH_TOKEN');
        return { kind: 'expired' };
      }
      let refreshToken;
      try {
        refreshToken = decryptField(c, 'refreshTokenEnc', 'refresh');
      } catch {
        await tx.trisConnection.update({ where: { userId }, data: { status: 'ERROR', lastErrorCode: 'DECRYPT_FAILED' } });
        await tx.trisConnectionEvent.create({ data: { userId, type: 'ERROR', detail: 'DECRYPT_FAILED' } });
        return { kind: 'fail', code: 'RECONNECT_REQUIRED' };
      }
      let tok;
      try {
        tok = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
      } catch (err) {
        const code = err instanceof TrisError ? err.code : 'UPSTREAM_ERROR';
        if (code === 'TOKEN_REJECTED') {
          await markExpired(tx, userId, 'REFRESH_REJECTED');
          return { kind: 'expired' };
        }
        // Vaqtinchalik xato (tarmoq, 5xx): ulanish saqlanadi, keyin yana uriniladi.
        await tx.trisConnection.update({ where: { userId }, data: { lastErrorCode: code } });
        return { kind: 'fail', code };
      }
      const conn = await tx.trisConnection.update({
        where: { userId },
        data: { ...tokenFields(userId, tok, c.refreshTokenEnc), lastRefreshAt: new Date(), lastErrorCode: null },
      });
      await tx.trisConnectionEvent.create({ data: { userId, type: 'REFRESHED' } });
      return { kind: 'ok', conn };
    },
    { maxWait: 15_000, timeout: 30_000 }
  );

  if (outcome.kind === 'expired') {
    await notifyUsers(prisma, [userId], { type: 'TRIS_DISCONNECTED', title: "Tris ulanishi uzildi, qayta bog'lang", linkUrl: PROFILE_LINK }).catch(() => {});
    throw new TrisError('RECONNECT_REQUIRED');
  }
  if (outcome.kind === 'fail') throw new TrisError(outcome.code);
  return outcome.conn;
}

// Yaroqli access token (kerak bo'lsa yangilab). rejectedEnc — tris 401 bergan
// tokenning shifrlangan ko'rinishi: aynan u hali bazada bo'lsa, yangilanadi.
async function getValidAccessToken(userId, { rejectedEnc = null } = {}) {
  if (!config.configured) throw new TrisError('NOT_CONFIGURED');
  let c = await prisma.trisConnection.findUnique({ where: { userId } });
  if (!c) throw new TrisError('NOT_CONNECTED');
  if (c.status !== 'ACTIVE') throw new TrisError('RECONNECT_REQUIRED');
  if (!isFresh(c) || c.accessTokenEnc === rejectedEnc) c = await refreshLocked(userId, rejectedEnc);
  try {
    return { token: decryptField(c, 'accessTokenEnc', 'access'), enc: c.accessTokenEnc };
  } catch (err) {
    if (!(err instanceof TrisCryptoError)) throw err;
    await prisma.trisConnection.update({ where: { userId }, data: { status: 'ERROR', lastErrorCode: 'DECRYPT_FAILED' } }).catch(() => {});
    throw new TrisError('RECONNECT_REQUIRED');
  }
}

// TRIS_API_BASE_URL + nisbiy yo'l. Boshqa host, sxema, "//", "..", "\"
// orqali chiqib ketish rad etiladi (SSRF himoyasi).
function buildApiUrl(path, query) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[\\\s]/.test(path) || path.includes('#')) {
    throw new TrisError('INVALID_PATH');
  }
  const base = new URL(config.apiBaseUrl);
  const basePath = base.pathname.replace(/\/+$/, '');
  let url;
  try {
    url = new URL(`${base.origin}${basePath}${path}`);
  } catch {
    throw new TrisError('INVALID_PATH');
  }
  if (url.origin !== base.origin || url.username || url.password) throw new TrisError('INVALID_PATH');
  if (basePath && url.pathname !== basePath && !url.pathname.startsWith(`${basePath}/`)) throw new TrisError('INVALID_PATH');
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    });
  }
  return url;
}

// Retry-After (soniya yoki HTTP sana); eng ko'pi 5 soniya kutiladi.
function retryDelay(headers, attempt) {
  const h = headers.get('retry-after');
  let ms = 500 * attempt;
  if (h) {
    const sec = Number(h);
    if (Number.isFinite(sec)) ms = sec * 1000;
    else if (!Number.isNaN(Date.parse(h))) ms = Date.parse(h) - Date.now();
  }
  return Math.min(Math.max(ms, 200), 5000);
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Foydalanuvchi nomidan tris API'ga so'rov.
 * @param {string} userId
 * @param {string} path  TRIS_API_BASE_URL ga nisbatan yo'l ("/..." bilan)
 * @param {{method?: string, query?: object, body?: any}} options
 * @returns {Promise<{status: number, ok: boolean, data: any}>} 2xx va oddiy
 *   4xx (404, 422...) qaytariladi; 401/403, 429, 5xx, 3xx, timeout — TrisError.
 */
async function trisRequest(userId, path, options = {}) {
  if (!config.configured) throw new TrisError('NOT_CONFIGURED');
  const method = String(options.method || 'GET').toUpperCase();
  if (!METHODS.includes(method)) throw new TrisError('INVALID_PATH');
  const url = buildApiUrl(path, options.query);
  const headers = { Accept: 'application/json' };
  let body;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let { token, enc } = await getValidAccessToken(userId);
  let refreshed = false;
  let retries = 0;
  for (;;) {
    const res = await httpCall(url, { method, headers: { ...headers, Authorization: `Bearer ${token}` }, body }, API_TIMEOUT_MS);
    if (res.status === 401 && !refreshed) {
      refreshed = true;
      ({ token, enc } = await getValidAccessToken(userId, { rejectedEnc: enc }));
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && retries < MAX_RETRIES) {
      retries += 1;
      await sleep(retryDelay(res.headers, retries));
      continue;
    }
    prisma.trisConnection.update({ where: { userId }, data: { lastUsedAt: new Date() } }).catch(() => {});
    if (res.status === 401 || res.status === 403) throw new TrisError('UNAUTHORIZED', { httpStatus: res.status });
    if (res.status === 429) throw new TrisError('RATE_LIMITED', { httpStatus: res.status });
    if (res.status >= 500 || (res.status >= 300 && res.status < 400)) throw new TrisError('UPSTREAM_ERROR', { httpStatus: res.status });
    const ct = res.headers.get('content-type') || '';
    return { status: res.status, ok: res.status >= 200 && res.status < 300, data: ct.includes('json') ? parseJson(res.text) : res.text };
  }
}

module.exports = {
  TrisError,
  tokenFields,
  exchangeCode,
  fetchUserInfo,
  revokeToken,
  getValidAccessToken,
  trisRequest,
  buildApiUrl,
  PROFILE_LINK,
};
