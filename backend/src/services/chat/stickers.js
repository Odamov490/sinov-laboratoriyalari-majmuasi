const fs = require('fs');
const multer = require('multer');
const prisma = require('../../config/prisma');
const { newKey, resolveKey, removeKeys, ensureDirs } = require('./storage');
const { mediaUrl } = require('./signing');
const { badRequest, notFound, forbidden } = require('./errors');
const { STARTER_STICKERS } = require('./starterStickers');

// Stikerlar: PNG/WebP/GIF/SVG, har biri ko'pi bilan 512 KB. SVG faqat <img>
// orqali ko'rsatiladi va skript, on* atributlar, tashqi havolalar bo'lsa
// rad etiladi. Fayllar chat omborida, imzolangan havola bilan beriladi.
const MAX_BYTES = 512 * 1024;

const stickerUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 20 } }).array('files', 20);

const requireSuperAdmin = (user) => {
  if (user.role !== 'SUPER_ADMIN') throw forbidden();
};

// Xavfli SVG belgilarini topadi (topilsa — rad).
function unsafeSvg(text) {
  const s = text.toLowerCase();
  if (!/<svg[\s>]/.test(s)) return true;
  if (/<!doctype|<!entity/.test(s)) return true;
  if (/<(script|foreignobject|iframe|object|embed|audio|video|link|meta|animate|set)[s>/]/.test(s)) return true;
  if (/@import/.test(s)) return true;
  if (/\son[a-z]+\s*=/.test(s)) return true;
  if (/javascript:|data:text\/html|vbscript:/.test(s)) return true;
  // Faqat ichki havolalar (#id) ruxsat.
  const hrefs = s.match(/(?:xlink:)?href\s*=\s*["'][^"']*["']/g) || [];
  if (hrefs.some((h) => !/=\s*["']#/.test(h))) return true;
  if (/url\(\s*["']?(?!#)/.test(s)) return true;
  return false;
}

function detectSticker(buf, name) {
  const ascii = buf.slice(0, 16).toString('latin1');
  if (buf[0] === 0x89 && ascii.slice(1, 4) === 'PNG') return 'image/png';
  if (ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')) return 'image/gif';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp';
  if (/\.svg$/i.test(name || '') || /^\s*(<\?xml|<svg)/i.test(buf.slice(0, 200).toString('utf8'))) {
    const text = buf.toString('utf8');
    if (text.includes('\u0000') || unsafeSvg(text)) return 'unsafe-svg';
    return 'image/svg+xml';
  }
  return null;
}

const stickerOut = (s, userId) => ({ id: s.id, emoji: s.emoji, order: s.order, mime: s.mime, url: mediaUrl(userId, s.id, 'sticker', 6 * 3600) });

// GET /admin/chat/stickers — faol to'plamlar (SUPER_ADMIN ?all=1 bilan hammasini).
async function listStickers(user, { all } = {}) {
  const packs = await prisma.stickerPack.findMany({
    where: all && user.role === 'SUPER_ADMIN' ? {} : { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { stickers: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  });
  return {
    items: packs.map((p) => ({
      id: p.id,
      title: p.title,
      isActive: p.isActive,
      order: p.order,
      stickers: p.stickers.map((s) => stickerOut(s, user.id)),
    })),
  };
}

const cleanTitle = (t) => {
  const v = typeof t === 'string' ? t.trim() : '';
  if (v.length < 1 || v.length > 100) throw badRequest("To'plam nomi 1–100 belgi.");
  return v;
};

async function createPack(user, body = {}) {
  requireSuperAdmin(user);
  return prisma.stickerPack.create({
    data: { title: cleanTitle(body.title), order: Number.isInteger(body.order) ? body.order : 0, createdById: user.id },
  });
}

async function updatePack(user, id, body = {}) {
  requireSuperAdmin(user);
  const data = {};
  if (body.title !== undefined) data.title = cleanTitle(body.title);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (Number.isInteger(body.order)) data.order = body.order;
  return prisma.stickerPack.update({ where: { id: String(id) }, data });
}

async function deletePack(user, id) {
  requireSuperAdmin(user);
  const pack = await prisma.stickerPack.findUnique({ where: { id: String(id) }, include: { stickers: { select: { storageKey: true } } } });
  if (!pack) throw notFound();
  await prisma.stickerPack.delete({ where: { id: pack.id } });
  await removeKeys(pack.stickers.map((s) => s.storageKey));
  return { deleted: true };
}

const cleanEmoji = (e) => (typeof e === 'string' && e.trim() ? e.trim().slice(0, 16) : null);

// multipart: files[] (+ emoji). Qaytaradi: qo'shilganlar va rad etilganlar soni.
async function addStickers(user, packId, files, body = {}) {
  requireSuperAdmin(user);
  const pack = await prisma.stickerPack.findUnique({ where: { id: String(packId) }, select: { id: true } });
  if (!pack) throw notFound();
  if (!files?.length) throw badRequest('Fayl tanlanmagan.');
  ensureDirs();
  let order = await prisma.sticker.count({ where: { packId: pack.id } });
  const added = [];
  const rejected = [];
  for (const f of files) {
    const mime = detectSticker(f.buffer, f.originalname);
    if (!mime || mime === 'unsafe-svg' || f.size > MAX_BYTES) {
      rejected.push({ reason: mime === 'unsafe-svg' ? "SVG xavfli elementlarga ega" : "Fayl turi yoki hajmi mos emas" });
      continue;
    }
    const storageKey = newKey('stickers/');
    await fs.promises.writeFile(resolveKey(storageKey), f.buffer);
    added.push(await prisma.sticker.create({ data: { packId: pack.id, storageKey, mime, emoji: cleanEmoji(body.emoji), order: order++ } }));
  }
  return { added: added.map((s) => stickerOut(s, user.id)), rejected };
}

async function updateSticker(user, id, body = {}) {
  requireSuperAdmin(user);
  const data = {};
  if (body.emoji !== undefined) data.emoji = cleanEmoji(body.emoji);
  if (Number.isInteger(body.order)) data.order = body.order;
  const s = await prisma.sticker.update({ where: { id: String(id) }, data });
  return stickerOut(s, user.id);
}

async function deleteSticker(user, id) {
  requireSuperAdmin(user);
  const s = await prisma.sticker.findUnique({ where: { id: String(id) } });
  if (!s) throw notFound();
  await prisma.sticker.delete({ where: { id: s.id } });
  await removeKeys([s.storageKey]);
  return { deleted: true };
}

// Ishga tushganda: hech qanday to'plam bo'lmasa — boshlang'ich 12 ta stiker.
async function seedStarterPack() {
  if (await prisma.stickerPack.count()) return false;
  ensureDirs();
  const pack = await prisma.stickerPack.create({ data: { title: 'Asosiy', order: 0 } });
  let order = 0;
  for (const item of STARTER_STICKERS) {
    const storageKey = newKey('stickers/');
    await fs.promises.writeFile(resolveKey(storageKey), item.svg, 'utf8');
    await prisma.sticker.create({ data: { packId: pack.id, storageKey, mime: 'image/svg+xml', emoji: item.emoji, order: order++ } });
  }
  return true;
}

module.exports = {
  stickerUpload,
  listStickers,
  createPack,
  updatePack,
  deletePack,
  addStickers,
  updateSticker,
  deleteSticker,
  seedStarterPack,
  unsafeSvg,
};
