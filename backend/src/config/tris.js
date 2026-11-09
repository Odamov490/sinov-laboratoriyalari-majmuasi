// Tris integratsiyasi sozlamalari (faqat muhit o'zgaruvchilaridan).
// Hech bir qiymat logga yoki API javobiga chiqmaydi: tashqariga faqat
// o'zgaruvchi NOMLARI va "o'rnatilgan / o'rnatilmagan" holati beriladi.
// Sozlama yetishmasa ilova ishlayveradi, integratsiya "sozlanmagan" bo'ladi.
const { NODE_ENV, PORT, CLIENT_URL } = require('./env');

const DEFAULT_API_BASE = 'https://api-laboratory.tris.uz';
const AUTH_METHODS = ['client_secret_basic', 'client_secret_post', 'none'];

const env = (name) => {
  const v = process.env[name];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
};
const isTrue = (name, fallback) => {
  const v = env(name);
  if (v === null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

// Soxta provayder faqat ishlab chiqishda; production'da hech qachon.
const mockRequested = isTrue('TRIS_OAUTH_MOCK', false);
const mockEnabled = mockRequested && NODE_ENV !== 'production';

// Mock yoqilganda bo'sh manzillar o'z-o'zidan mock'ga yo'naltiriladi:
// brauzer ko'radigan authorize — CLIENT_URL orqali (nginx/vite proxy),
// serverdan serverga so'rovlar — to'g'ridan-to'g'ri backend'ga.
const SELF = `http://127.0.0.1:${PORT}/api/tris/mock`;
const mockDefaults = mockEnabled
  ? {
      TRIS_API_BASE_URL: `${SELF}/api`,
      TRIS_OAUTH_AUTHORIZE_URL: `${CLIENT_URL}/api/tris/mock/authorize`,
      TRIS_OAUTH_TOKEN_URL: `${SELF}/token`,
      TRIS_OAUTH_REVOKE_URL: `${SELF}/revoke`,
      TRIS_OAUTH_USERINFO_URL: `${SELF}/userinfo`,
      TRIS_OAUTH_CLIENT_ID: 'slm-mock-client',
      TRIS_OAUTH_CLIENT_SECRET: 'slm-mock-secret',
      TRIS_OAUTH_REDIRECT_URI: `${CLIENT_URL}/api/tris/callback`,
      TRIS_API_PING_PATH: '/ping',
    }
  : {};
const get = (name) => env(name) ?? mockDefaults[name] ?? null;

const validUrl = (v, { allowHttp = NODE_ENV !== 'production' } = {}) => {
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || (allowHttp && u.protocol === 'http:');
  } catch {
    return false;
  }
};

// 32 baytlik kalit (base64). Noto'g'ri bo'lsa — null (sozlanmagan).
function parseKey(v) {
  if (!v) return null;
  try {
    const buf = Buffer.from(v, 'base64');
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

function load() {
  const authMethodRaw = (get('TRIS_OAUTH_TOKEN_AUTH_METHOD') || 'client_secret_basic').toLowerCase();
  const cfg = {
    apiBaseUrl: get('TRIS_API_BASE_URL') || DEFAULT_API_BASE,
    authorizeUrl: get('TRIS_OAUTH_AUTHORIZE_URL'),
    tokenUrl: get('TRIS_OAUTH_TOKEN_URL'),
    revokeUrl: get('TRIS_OAUTH_REVOKE_URL'),
    userinfoUrl: get('TRIS_OAUTH_USERINFO_URL'),
    clientId: get('TRIS_OAUTH_CLIENT_ID'),
    clientSecret: get('TRIS_OAUTH_CLIENT_SECRET'),
    authMethod: AUTH_METHODS.includes(authMethodRaw) ? authMethodRaw : null,
    scopes: (get('TRIS_OAUTH_SCOPES') || '').split(/\s+/).filter(Boolean),
    redirectUri: get('TRIS_OAUTH_REDIRECT_URI'),
    pkce: isTrue('TRIS_OAUTH_PKCE', true),
    pingPath: get('TRIS_API_PING_PATH'),
    // Kalit: mock'da ham haqiqiy kalit talab qilinadi (sinov .env'da).
    encryptionKey: parseKey(env('TRIS_TOKEN_ENCRYPTION_KEY')),
    keyVersion: 1,
    mock: mockEnabled,
    mockRequested,
  };

  // Yetishmayotgan yoki noto'g'ri sozlamalar (faqat nomlari).
  const missing = [];
  if (!validUrl(cfg.apiBaseUrl)) missing.push('TRIS_API_BASE_URL');
  if (!validUrl(cfg.authorizeUrl)) missing.push('TRIS_OAUTH_AUTHORIZE_URL');
  if (!validUrl(cfg.tokenUrl)) missing.push('TRIS_OAUTH_TOKEN_URL');
  if (cfg.revokeUrl && !validUrl(cfg.revokeUrl)) missing.push('TRIS_OAUTH_REVOKE_URL');
  if (cfg.userinfoUrl && !validUrl(cfg.userinfoUrl)) missing.push('TRIS_OAUTH_USERINFO_URL');
  if (!cfg.clientId) missing.push('TRIS_OAUTH_CLIENT_ID');
  if (!cfg.authMethod) missing.push('TRIS_OAUTH_TOKEN_AUTH_METHOD');
  if (cfg.authMethod && cfg.authMethod !== 'none' && !cfg.clientSecret) missing.push('TRIS_OAUTH_CLIENT_SECRET');
  if (!validUrl(cfg.redirectUri)) missing.push('TRIS_OAUTH_REDIRECT_URI');
  if (!cfg.encryptionKey) missing.push('TRIS_TOKEN_ENCRYPTION_KEY');
  // Ommaviy mijoz (secret'siz) PKCE'siz xavfli — ruxsat bermaymiz.
  if (cfg.authMethod === 'none' && !cfg.pkce) missing.push('TRIS_OAUTH_PKCE');

  cfg.missing = missing;
  cfg.configured = missing.length === 0;
  return cfg;
}

const config = load();

// SUPER_ADMIN uchun: qaysi sozlama o'rnatilgan (true/false), qiymatlarsiz.
function configSummary() {
  const names = [
    'TRIS_API_BASE_URL',
    'TRIS_OAUTH_AUTHORIZE_URL',
    'TRIS_OAUTH_TOKEN_URL',
    'TRIS_OAUTH_REVOKE_URL',
    'TRIS_OAUTH_USERINFO_URL',
    'TRIS_OAUTH_CLIENT_ID',
    'TRIS_OAUTH_CLIENT_SECRET',
    'TRIS_OAUTH_TOKEN_AUTH_METHOD',
    'TRIS_OAUTH_SCOPES',
    'TRIS_OAUTH_REDIRECT_URI',
    'TRIS_OAUTH_PKCE',
    'TRIS_TOKEN_ENCRYPTION_KEY',
    'TRIS_API_PING_PATH',
  ];
  return {
    configured: config.configured,
    missing: config.missing,
    mock: config.mock,
    // Sukut qiymati bor sozlamalar (API manzili, usul, PKCE) ham "o'rnatilgan" deb ko'rsatiladi.
    settings: names.map((name) => ({ name, set: Boolean(env(name)) || (config.mock && Boolean(mockDefaults[name])) })),
  };
}

module.exports = { config, configSummary, AUTH_METHODS };
