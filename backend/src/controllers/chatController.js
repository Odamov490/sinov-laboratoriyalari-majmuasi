const { z } = require('zod');
const prisma = require('../config/prisma');
const rooms = require('../services/chat/rooms');
const messages = require('../services/chat/messages');
const { getSettings, invalidateSettings } = require('../services/chat/settings');
const { ChatError, forbidden } = require('../services/chat/errors');
const uploads = require('../services/chat/uploads');
const stickers = require('../services/chat/stickers');
const { diskUsage } = require('../services/chat/storage');

// /admin/chat — barcha handlerlar yupqa: tekshiruv va mantiq
// services/chat/* da (socket ham o'sha funksiyalarni chaqiradi).
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res))
    .then((data) => {
      if (!res.headersSent) res.json(data);
    })
    .catch(next);

// requireChatUser'dan keyin: req.chatUser = { id, role, fullName }.
const me = (req) => req.chatUser;

// Chatga kirish: hisobda chat o'chirilgan bo'lsa yoki butun chat o'chirilgan
// bo'lsa (SUPER_ADMIN bundan mustasno — sozlamalarni qaytarib yoqishi kerak).
async function requireChatUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, role: true, fullName: true, chatEnabled: true },
    });
    if (!user) return res.status(401).json({ error: 'Hisob faol emas.' });
    if (!user.chatEnabled) return res.status(403).json({ error: "Siz uchun chat o'chirilgan.", code: 'CHAT_DISABLED' });
    const settings = await getSettings();
    if (!settings.chatEnabled && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: "Chat vaqtincha o'chirilgan.", code: 'CHAT_DISABLED' });
    }
    req.chatUser = { id: user.id, role: user.role, fullName: user.fullName };
    next();
  } catch (err) {
    next(err);
  }
}

// Xona/xabar xatolari o'z statusi bilan; boshqasi — umumiy 500. Logga faqat
// yo'l shabloni va xato kodi yoziladi (so'rov tanasi, matn, fayl nomi yo'q).
// eslint-disable-next-line no-unused-vars
function chatErrorHandler(err, req, res, next) {
  if (err instanceof ChatError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err.name === 'ZodError') return res.status(400).json({ error: "Ma'lumot noto'g'ri." });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Topilmadi.' });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Fayl juda katta.' : "Faylni yuklab bo'lmadi." });
  console.error(`[chat] ${req.method} ${req.baseUrl}${req.route?.path || ''} -> ${err.code || err.name || 'Error'}`);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi.' });
}

// --- Xonalar ---------------------------------------------------------------
const listRooms = wrap((req) => rooms.listRooms(me(req)));
const unread = wrap((req) => rooms.unreadSummary(me(req)));
const getRoom = wrap((req) => rooms.getRoom(me(req), req.params.id));
const directory = wrap((req) => rooms.directory(me(req), req.query.q));
const openDirect = wrap((req) => rooms.openDirect(me(req), req.body?.userId));
const createGroup = wrap(async (req, res) => {
  const room = await rooms.createGroup(me(req), req.body || {});
  res.status(201);
  return room;
});
const renameGroup = wrap((req) => rooms.renameGroup(me(req), req.params.id, req.body || {}));
const addMembers = wrap((req) => rooms.addMembers(me(req), req.params.id, req.body || {}));
const removeMember = wrap((req) => rooms.removeMember(me(req), req.params.id, req.params.userId));
const setMemberRole = wrap((req) => rooms.setMemberRole(me(req), req.params.id, req.params.userId, req.body || {}));
const leaveRoom = wrap((req) => rooms.leaveRoom(me(req), req.params.id));
const setArchived = wrap((req) => rooms.setArchived(me(req), req.params.id, req.body || {}));
const setMute = wrap((req) => rooms.setMute(me(req), req.params.id, req.body || {}));

// --- Xabarlar --------------------------------------------------------------
const listMessages = wrap((req) =>
  messages.listMessages(me(req), req.params.id, {
    before: req.query.before,
    after: req.query.after,
    around: req.query.around,
    limit: req.query.limit,
  })
);
// Socket bo'lmaganda zaxira yo'l; idempotent (clientId).
const sendMessage = wrap(async (req, res) => {
  const result = await messages.sendMessage(me(req), req.params.id, req.body || {});
  res.status(result.duplicate ? 200 : 201);
  return result;
});
const editMessage = wrap((req) => messages.editMessage(me(req), req.params.messageId, req.body || {}));
const deleteMessage = wrap((req) => messages.deleteMessage(me(req), req.params.messageId, req.query.scope || req.body?.scope || 'me'));
const toggleReaction = wrap((req) => messages.toggleReaction(me(req), req.params.messageId, req.body?.emoji));
const pin = wrap((req) => messages.pinMessage(me(req), req.params.messageId, true));
const unpin = wrap((req) => messages.pinMessage(me(req), req.params.messageId, false));
const listPins = wrap(async (req) => ({ items: await messages.listPins(me(req), req.params.id) }));
const markRead = wrap((req) => messages.markRead(me(req), req.params.id, req.body?.messageId));
const search = wrap((req) =>
  messages.searchMessages(me(req), { q: req.query.q, roomId: req.query.roomId, offset: req.query.offset, limit: req.query.limit })
);

// --- Media, ulashish ---------------------------------------------------
const uploadMiddleware = uploads.uploadMiddleware;
const upload = wrap(async (req, res) => {
  const result = await uploads.handleUpload(req);
  res.status(201);
  return result;
});
const mediaUrls = wrap((req) => messages.mediaUrls(me(req), req.body?.ids));
const forward = wrap((req) => messages.forwardMessage(me(req), req.params.messageId, req.body?.roomIds));

// --- Stikerlar -------------------------------------------------------------
const stickerUploadMiddleware = (req, res, next) => stickers.stickerUpload(req, res, next);
const listStickers = wrap((req) => stickers.listStickers(me(req), { all: req.query.all === '1' }));
const createPack = wrap(async (req, res) => {
  const pack = await stickers.createPack(me(req), req.body || {});
  res.status(201);
  return pack;
});
const updatePack = wrap((req) => stickers.updatePack(me(req), req.params.id, req.body || {}));
const deletePack = wrap((req) => stickers.deletePack(me(req), req.params.id));
const addStickers = wrap(async (req, res) => {
  const result = await stickers.addStickers(me(req), req.params.id, req.files, req.body || {});
  res.status(201);
  return result;
});
const updateSticker = wrap((req) => stickers.updateSticker(me(req), req.params.id, req.body || {}));
const deleteSticker = wrap((req) => stickers.deleteSticker(me(req), req.params.id));

// --- SUPER_ADMIN: disk va statistika ---------------------------------------
const adminStats = wrap(async (req) => {
  if (me(req).role !== 'SUPER_ADMIN') throw forbidden();
  const [byKind, pending, expired, disk, messagesCount, roomsByType] = await Promise.all([
    prisma.chatAttachment.groupBy({ by: ['kind'], where: { expiredAt: null }, _sum: { size: true }, _count: true }),
    prisma.chatAttachment.aggregate({ where: { status: 'PENDING' }, _sum: { size: true }, _count: true }),
    prisma.chatAttachment.count({ where: { expiredAt: { not: null } } }),
    diskUsage(),
    prisma.chatMessage.count({ where: { deletedAt: null } }),
    prisma.chatRoom.groupBy({ by: ['type'], _count: true }),
  ]);
  return {
    disk,
    byKind: byKind.map((k) => ({ kind: k.kind, count: k._count, size: k._sum.size || 0 })),
    pending: { count: pending._count, size: pending._sum.size || 0 },
    expiredCount: expired,
    messagesCount,
    roomsByType: roomsByType.map((r) => ({ type: r.type, count: r._count })),
  };
});

// --- Sozlamalar ------------------------------------------------------------
const LIMIT_FIELDS = [
  'maxImageMB',
  'maxVideoMB',
  'maxAudioMB',
  'maxFileMB',
  'maxVoiceSeconds',
  'maxVideoNoteSeconds',
  'editWindowMinutes',
  'deleteForAllWindowMinutes',
];

// Hammaga: faqat cheklovlar (klient oldindan tekshirishi uchun).
const getLimits = wrap(async (req) => {
  const s = await getSettings();
  const out = Object.fromEntries(LIMIT_FIELDS.map((k) => [k, s[k]]));
  out.canCreateGroups = await rooms.canCreateGroups(me(req));
  if (me(req).role === 'SUPER_ADMIN') Object.assign(out, { mediaRetentionDays: s.mediaRetentionDays, whoCanCreateGroups: s.whoCanCreateGroups, chatEnabled: s.chatEnabled });
  return out;
});

const settingsSchema = z
  .object({
    maxImageMB: z.number().int().min(1).max(100),
    // Cloudflare bitta so'rovni 100 MB bilan cheklaydi.
    maxVideoMB: z.number().int().min(1).max(95),
    maxAudioMB: z.number().int().min(1).max(95),
    maxFileMB: z.number().int().min(1).max(95),
    maxVoiceSeconds: z.number().int().min(10).max(1800),
    maxVideoNoteSeconds: z.number().int().min(5).max(120),
    editWindowMinutes: z.number().int().min(0).max(525600),
    deleteForAllWindowMinutes: z.number().int().min(0).max(525600),
    mediaRetentionDays: z.number().int().min(0).max(3650),
    whoCanCreateGroups: z.enum(['ALL', 'MANAGERS']),
    chatEnabled: z.boolean(),
  })
  .partial();

const updateSettings = wrap(async (req) => {
  if (me(req).role !== 'SUPER_ADMIN') throw forbidden();
  const data = settingsSchema.parse(req.body || {});
  const saved = await prisma.chatSetting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  invalidateSettings();
  return saved;
});

module.exports = {
  requireChatUser,
  chatErrorHandler,
  listRooms,
  unread,
  getRoom,
  directory,
  openDirect,
  createGroup,
  renameGroup,
  addMembers,
  removeMember,
  setMemberRole,
  leaveRoom,
  setArchived,
  setMute,
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  pin,
  unpin,
  listPins,
  markRead,
  search,
  getLimits,
  updateSettings,
  uploadMiddleware,
  upload,
  mediaUrls,
  forward,
  stickerUploadMiddleware,
  listStickers,
  createPack,
  updatePack,
  deletePack,
  addStickers,
  updateSticker,
  deleteSticker,
  adminStats,
};
