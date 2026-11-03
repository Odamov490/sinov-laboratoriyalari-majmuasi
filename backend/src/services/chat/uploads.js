const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const prisma = require('../../config/prisma');
const { getSettings } = require('./settings');
const { consume } = require('./rateLimit');
const { TMP, ensureDirs, newKey, resolveKey } = require('./storage');
const { detect, detectThumb } = require('./fileTypes');
const { attachmentOut } = require('./messages');
const { badRequest, ChatError } = require('./errors');

// POST /admin/chat/uploads — fayl PENDING holatda saqlanadi va xabar
// yuborilganda biriktiriladi; yuborilmaganlari 24 soatdan keyin cron
// tomonidan o'chiriladi. Magic-bytes tekshiruvi, tur bo'yicha hajm cheklovi.
const HARD_LIMIT_MB = 100;
const THUMB_MAX = 600 * 1024;

ensureDirs();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDirs();
      cb(null, TMP);
    },
    filename: (req, file, cb) => cb(null, crypto.randomUUID()),
  }),
  limits: { fileSize: HARD_LIMIT_MB * 1024 * 1024, files: 2, fields: 10, fieldSize: 4096 },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumb', maxCount: 1 },
]);

const unlinkQuiet = (p) => p && fs.promises.unlink(p).catch(() => {});

// Multer UTF-8 nomlarni latin1 sifatida o'qiydi.
function cleanName(raw) {
  let name = String(raw || 'fayl');
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    if (!decoded.includes('�')) name = decoded;
  } catch {
    /* asl nom qoladi */
  }
  name = path.basename(name).replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').trim();
  return (name || 'fayl').slice(0, 200);
}

const LIMIT_FIELD = { IMAGE: 'maxImageMB', VIDEO: 'maxVideoMB', AUDIO: 'maxAudioMB', FILE: 'maxFileMB' };
const intField = (v, max) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
};

// Express middleware: tezlik cheklovi multer'dan oldin.
function uploadMiddleware(req, res, next) {
  try {
    consume('upload', req.chatUser.id);
  } catch (err) {
    return next(err);
  }
  upload(req, res, (err) => {
    if (!err) return next();
    const files = Object.values(req.files || {}).flat();
    files.forEach((f) => unlinkQuiet(f.path));
    if (err.code === 'LIMIT_FILE_SIZE') return next(new ChatError(413, `Fayl ${HARD_LIMIT_MB} MB dan katta.`, 'TOO_LARGE'));
    return next(badRequest('Faylni yuklab bo\'lmadi.'));
  });
}

async function handleUpload(req) {
  const file = req.files?.file?.[0];
  const thumb = req.files?.thumb?.[0];
  try {
    if (!file) throw badRequest('Fayl tanlanmagan.');
    const purpose = ['voice', 'video_note'].includes(req.body?.purpose) ? req.body.purpose : undefined;
    const originalName = cleanName(file.originalname);
    const type = await detect(file.path, originalName, purpose);
    if (!type) throw badRequest("Bu turdagi fayl qabul qilinmaydi.");

    const settings = await getSettings();
    const maxMB = settings[LIMIT_FIELD[type.kind]];
    if (file.size > maxMB * 1024 * 1024) throw new ChatError(413, `Fayl hajmi ${maxMB} MB dan oshmasin.`, 'TOO_LARGE');
    if (!file.size) throw badRequest("Fayl bo'sh.");

    const storageKey = newKey();
    await fs.promises.rename(file.path, resolveKey(storageKey));
    let thumbKey = null;
    if (thumb && thumb.size <= THUMB_MAX && (await detectThumb(thumb.path))) {
      thumbKey = `${storageKey}-t`;
      await fs.promises.rename(thumb.path, resolveKey(thumbKey));
    }

    const created = await prisma.chatAttachment.create({
      data: {
        uploaderId: req.chatUser.id,
        storageKey,
        thumbKey,
        originalName,
        mime: type.mime,
        size: file.size,
        kind: type.kind,
        width: intField(req.body?.width, 20000),
        height: intField(req.body?.height, 20000),
        durationSec: Number(req.body?.durationSec) > 0 ? Math.min(Number(req.body.durationSec), 86400) : null,
        status: 'PENDING',
      },
    });
    return { attachment: attachmentOut(created, req.chatUser.id) };
  } finally {
    await unlinkQuiet(file?.path && fs.existsSync(file.path) ? file.path : null);
    await unlinkQuiet(thumb?.path && fs.existsSync(thumb.path) ? thumb.path : null);
  }
}

module.exports = { uploadMiddleware, handleUpload };
