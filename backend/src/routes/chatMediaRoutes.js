const fs = require('fs');
const express = require('express');
const prisma = require('../config/prisma');
const { verify } = require('../services/chat/signing');
const { resolveKey } = require('../services/chat/storage');
const { detectThumb } = require('../services/chat/fileTypes');
const { isChatActive } = require('../services/chat/membership');
const { getSettings } = require('../services/chat/settings');

// GET /api/chat/media/:id?v=full|thumb|sticker&u=&e=&s=[&dl=1]
// Cookie/token talab qilinmaydi (<img>/<video> uchun) — o'rniga qisqa
// muddatli HMAC imzo. Har so'rovda imzo, muddat, foydalanuvchi holati va
// xonaga a'zolik qayta tekshiriladi. Range (206) qo'llanadi.
const router = express.Router();
const ID_RE = /^[0-9a-f-]{36}$/;

function deny(res, status) {
  res.set('Cache-Control', 'no-store');
  return res.status(status).type('text/plain').send(status === 410 ? 'Havola muddati tugagan' : 'Topilmadi');
}

const INLINE_PREFIX = ['image/', 'video/', 'audio/'];

async function resolveTarget(id, variant, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, deletedAt: true, chatEnabled: true, role: true },
  });
  if (!isChatActive(user)) return null;
  const settings = await getSettings();
  if (!settings.chatEnabled && user.role !== 'SUPER_ADMIN') return null;

  if (variant === 'sticker') {
    const sticker = await prisma.sticker.findUnique({ where: { id }, select: { storageKey: true, mime: true } });
    if (!sticker) return null;
    return { key: sticker.storageKey, mime: sticker.mime, name: 'sticker', inline: true };
  }

  const a = await prisma.chatAttachment.findUnique({
    where: { id },
    select: {
      storageKey: true,
      thumbKey: true,
      mime: true,
      originalName: true,
      expiredAt: true,
      uploaderId: true,
      status: true,
      message: { select: { roomId: true, deletedAt: true } },
    },
  });
  if (!a || a.expiredAt) return null;
  if (a.message) {
    if (a.message.deletedAt) return null;
    const member = await prisma.chatMember.findFirst({ where: { roomId: a.message.roomId, userId, leftAt: null }, select: { id: true } });
    if (!member) return null;
  } else if (!(a.status === 'PENDING' && a.uploaderId === userId)) {
    return null;
  }
  if (variant === 'thumb') {
    if (!a.thumbKey) return null;
    const mime = await detectThumb(resolveKey(a.thumbKey)).catch(() => null);
    return mime ? { key: a.thumbKey, mime, name: 'thumb', inline: true } : null;
  }
  return { key: a.storageKey, mime: a.mime, name: a.originalName, inline: INLINE_PREFIX.some((p) => a.mime.startsWith(p)) };
}

const encodeName = (name) => encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

router.get('/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ID_RE.test(id)) return deny(res, 404);
    const sig = verify(id, req.query);
    if (!sig.ok) return deny(res, sig.status === 410 ? 410 : 404);
    const target = await resolveTarget(id, sig.variant, sig.userId);
    if (!target) return deny(res, 404);

    const file = resolveKey(target.key);
    let stat;
    try {
      stat = await fs.promises.stat(file);
    } catch {
      return deny(res, 404);
    }
    const maxAge = Math.max(0, sig.exp - Math.floor(Date.now() / 1000));
    const disposition = target.inline && req.query.dl !== '1' ? 'inline' : 'attachment';
    res.set({
      'Content-Type': target.mime,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': `private, max-age=${maxAge}`,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `${disposition}; filename="${target.name.replace(/[^\x20-\x7e]|"/g, '_')}"; filename*=UTF-8''${encodeName(target.name)}`,
      'Cross-Origin-Resource-Policy': 'same-origin',
    });

    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      let start;
      let end;
      if (m && (m[1] || m[2])) {
        if (m[1]) {
          start = Number(m[1]);
          end = m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
        } else {
          start = Math.max(stat.size - Number(m[2]), 0);
          end = stat.size - 1;
        }
      }
      if (start === undefined || start > end || start >= stat.size) {
        res.set('Content-Range', `bytes */${stat.size}`);
        return res.status(416).end();
      }
      res.status(206).set({ 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': String(end - start + 1) });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
    }
    res.set('Content-Length', String(stat.size));
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch (err) {
    console.error(`[chat] media -> ${err.code || err.name}`);
    return deny(res, 404);
  }
});

module.exports = router;
