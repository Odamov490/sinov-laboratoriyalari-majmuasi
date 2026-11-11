// OnlyOffice Document Server (SMK forma shablonlarini brauzerda ochish/tahrirlash).
// Sozlanmagan bo'lsa (ONLYOFFICE_JWT_SECRET yo'q) ilova baribir ishlaydi —
// faqat "Ochish" tugmasi "sozlanmagan" xabarini qaytaradi.
const trimSlash = (s) => String(s || '').replace(/\/+$/, '');

const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || '';

module.exports = {
  ONLYOFFICE_ENABLED: JWT_SECRET.length >= 32,
  ONLYOFFICE_JWT_SECRET: JWT_SECRET,
  // Brauzer api.js'ni shu yo'ldan yuklaydi (nginx /onlyoffice/ -> onlyoffice konteyneri).
  ONLYOFFICE_PUBLIC_PATH: trimSlash(process.env.ONLYOFFICE_PUBLIC_PATH || '/onlyoffice'),
  // Backend tahrirlangan faylni shu ichki manzildan yuklab oladi.
  ONLYOFFICE_INTERNAL_URL: trimSlash(process.env.ONLYOFFICE_INTERNAL_URL || 'http://onlyoffice'),
  // OnlyOffice konteyneri faylni va callback'ni shu ichki manzil orqali oladi.
  BACKEND_INTERNAL_URL: trimSlash(process.env.BACKEND_INTERNAL_URL || 'http://backend:4000'),
};
