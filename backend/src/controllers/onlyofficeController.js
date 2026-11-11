const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { MAX_FILE_SIZE_MB } = require('../config/env');
const { absoluteUploadDir, verifyFileSignature } = require('../middleware/upload');
const oo = require('../config/onlyoffice');

// SMK forma shablonini OnlyOffice'da ochish (SUPER_ADMIN — tahrirlash, boshqalar — ko'rish)
// va OnlyOffice saqlaganda faylni yangilash (callback).
// Loglarga token, fayl havolasi va hujjat mazmuni yozilmaydi.

const DOC_TYPES = {
  docx: 'word', doc: 'word', odt: 'word', rtf: 'word', txt: 'word',
  xlsx: 'cell', xls: 'cell', ods: 'cell', csv: 'cell',
  pdf: 'pdf',
};
// Faqat shu formatlar saqlanadi (eski .doc/.xls va PDF — ko'rish rejimida).
const EDITABLE = new Set(['docx', 'xlsx']);
const LANGS = { uz: 'ru', ru: 'ru', en: 'en' };

const extOf = (url) => path.extname(String(url || '')).slice(1).toLowerCase();
const docKey = (form) => `${form.id}-v${form.templateVersion}`;

const getEditorConfig = asyncHandler(async (req, res) => {
  if (!oo.ONLYOFFICE_ENABLED) {
    return res.status(503).json({ error: 'Onlayn muharrir (OnlyOffice) serverda sozlanmagan.' });
  }
  const form = await prisma.smkForm.findUnique({ where: { id: req.params.id } });
  if (!form || !form.templateUrl || !form.templateUrl.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Shablon fayli topilmadi.' });
  }
  const ext = extOf(form.templateUrl);
  const documentType = DOC_TYPES[ext];
  if (!documentType) return res.status(400).json({ error: 'Bu fayl turini onlayn ochib bo\'lmaydi.' });

  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true, fullName: true } });
  const canEdit = req.user.role === 'SUPER_ADMIN' && EDITABLE.has(ext);
  const config = {
    documentType,
    document: {
      fileType: ext,
      key: docKey(form),
      title: form.templateName || `${form.code}.${ext}`,
      url: `${oo.BACKEND_INTERNAL_URL}${form.templateUrl}`,
      permissions: { edit: canEdit, download: true, print: true, comment: canEdit },
    },
    editorConfig: {
      mode: canEdit ? 'edit' : 'view',
      lang: LANGS[req.query.lang] || 'ru',
      callbackUrl: `${oo.BACKEND_INTERNAL_URL}/api/onlyoffice/callback/${form.id}`,
      user: { id: user.id, name: user.fullName },
      customization: { forcesave: canEdit, autosave: true, compactHeader: true },
    },
  };
  config.token = jwt.sign(config, oo.ONLYOFFICE_JWT_SECRET, { algorithm: 'HS256', expiresIn: '12h' });
  res.json({
    apiUrl: `${oo.ONLYOFFICE_PUBLIC_PATH}/web-apps/apps/api/documents/api.js`,
    canEdit,
    config,
  });
});

// Callback ma'lumoti: JWT tanada (token) yoki Authorization sarlavhasida ({ payload }).
function verifiedCallback(req) {
  const opts = { algorithms: ['HS256'] };
  if (req.body && typeof req.body.token === 'string') return jwt.verify(req.body.token, oo.ONLYOFFICE_JWT_SECRET, opts);
  const header = String(req.headers.authorization || '');
  if (header.startsWith('Bearer ')) {
    const decoded = jwt.verify(header.slice(7), oo.ONLYOFFICE_JWT_SECRET, opts);
    return decoded.payload || null;
  }
  return null;
}

// OnlyOffice bergan havoladan faqat yo'lni olib, ichki OnlyOffice manziliga
// yo'naltiradi (boshqa hostga hech qachon so'rov yuborilmaydi).
function internalDownloadUrl(raw) {
  const u = new URL(String(raw));
  let p = u.pathname;
  const prefix = new URL(oo.ONLYOFFICE_PUBLIC_PATH, 'http://x').pathname.replace(/\/+$/, '') || '/';
  if (prefix !== '/' && (p === prefix || p.startsWith(`${prefix}/`))) p = p.slice(prefix.length) || '/';
  return `${oo.ONLYOFFICE_INTERNAL_URL}${p}${u.search}`;
}

async function downloadTo(url, dest) {
  const max = MAX_FILE_SIZE_MB * 1024 * 1024;
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw Object.assign(new Error('download'), { code: `HTTP_${res.status}` });
  if (Number(res.headers.get('content-length') || 0) > max) throw Object.assign(new Error('size'), { code: 'TOO_LARGE' });
  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.length;
    if (size > max) throw Object.assign(new Error('size'), { code: 'TOO_LARGE' });
    chunks.push(chunk);
  }
  fs.writeFileSync(dest, Buffer.concat(chunks));
}

const callback = asyncHandler(async (req, res) => {
  if (!oo.ONLYOFFICE_ENABLED) return res.status(503).json({ error: 1 });
  let data;
  try {
    data = verifiedCallback(req);
  } catch {
    data = null;
  }
  if (!data) return res.status(403).json({ error: 1 });

  const status = Number(data.status);
  // 2 — hamma yopdi, saqlash kerak; 6 — "Saqlash" (forcesave). Qolganlari — faqat holat.
  if (status !== 2 && status !== 6) {
    if (status === 3 || status === 7) console.warn(`[onlyoffice] document save error status ${status}`);
    return res.json({ error: 0 });
  }

  const form = await prisma.smkForm.findUnique({ where: { id: req.params.formId } });
  // Eskirgan sessiya (kalit mos emas) — e'tiborsiz, OnlyOffice qayta urinmasin.
  if (!form || !form.templateUrl || data.key !== docKey(form)) return res.json({ error: 0 });
  const ext = extOf(form.templateUrl);
  if (!EDITABLE.has(ext) || (data.filetype && String(data.filetype).toLowerCase() !== ext) || !data.url) {
    return res.json({ error: 1 });
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const dest = path.join(absoluteUploadDir, filename);
  try {
    await downloadTo(internalDownloadUrl(data.url), dest);
    if (!verifyFileSignature(dest)) throw Object.assign(new Error('sig'), { code: 'BAD_SIGNATURE' });
  } catch (err) {
    fs.rmSync(dest, { force: true });
    console.error(`[onlyoffice] save failed: ${err.code || err.name}`);
    return res.json({ error: 1 });
  }

  // Shu vaqt ichida shablon almashtirilmagan bo'lsagina yangilanadi.
  const updated = await prisma.smkForm.updateMany({
    where: { id: form.id, templateUrl: form.templateUrl, templateVersion: form.templateVersion },
    data: {
      templateUrl: `/uploads/${filename}`,
      // Hamma yopgach (2) yangi kalit: keyingi ochilish yangi fayldan boshlanadi.
      ...(status === 2 ? { templateVersion: { increment: 1 } } : {}),
    },
  });
  if (!updated.count) {
    fs.rmSync(dest, { force: true });
    return res.json({ error: 0 });
  }
  const old = path.join(absoluteUploadDir, path.basename(form.templateUrl));
  if (old.startsWith(absoluteUploadDir + path.sep)) fs.rmSync(old, { force: true });
  res.json({ error: 0 });
});

module.exports = { getEditorConfig, callback, internalDownloadUrl, docKey };
