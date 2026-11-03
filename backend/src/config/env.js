require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Do not crash the whole app on import; routes that need it will fail loudly instead.
    console.warn(`[env] Warning: ${name} is not set.`);
  }
  return value;
}

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB || 10),
  // Domain appended to a bare login ("axror" -> "axror@slm.uz"). These are
  // login names only, never real mailboxes: the system sends them no mail.
  LOGIN_EMAIL_DOMAIN: (process.env.LOGIN_EMAIL_DOMAIN || 'slm.uz').replace(/^@/, '').toLowerCase(),
};
