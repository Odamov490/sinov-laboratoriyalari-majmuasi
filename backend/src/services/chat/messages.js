const crypto = require('crypto');
const fs = require('fs');
const { Prisma } = require('@prisma/client');
const prisma = require('../../config/prisma');
const { chatEvents } = require('./events');
const { getSettings } = require('./settings');
const { consume } = require('./rateLimit');
const { removeKeys, resolveKey, newKey } = require('./storage');
const { mediaUrl } = require('./signing');
const { requireMember, requireWriter, requireMessage, ANNOUNCERS } = require('./access');
const { notFound, forbidden, badRequest } = require('./errors');

// Xabarlar bilan ishlaydigan yagona servis: REST ham, socket ham shu
// funksiyalarni chaqiradi. Matn va fayl nomlari hech qachon loglanmaydi.
const MAX_BODY = 4000;
const CLIENT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const MAX_REACTIONS_PER_USER = 3;
const MAX_PINS = 20;
const MAX_ATTACHMENTS = 10;
const MAX_FORWARD_TARGETS = 10;

const ATTACHMENT_SELECT = {
  id: true,
  originalName: true,
  mime: true,
  size: true,
  kind: true,
  width: true,
  height: true,
  durationSec: true,
  thumbKey: true,
  expiredAt: true,
};

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, fullName: true } },
  replyTo: {
    select: { id: true, senderId: true, type: true, body: true, deletedAt: true, sender: { select: { fullName: true } } },
  },
  reactions: { select: { emoji: true, userId: true }, orderBy: { createdAt: 'asc' } },
  attachments: { select: ATTACHMENT_SELECT, orderBy: { createdAt: 'asc' } },
};

function aggregateReactions(list) {
  const map = new Map();
  for (const r of list || []) {
    if (!map.has(r.emoji)) map.set(r.emoji, { emoji: r.emoji, count: 0, userIds: [] });
    const item = map.get(r.emoji);
    item.count += 1;
    item.userIds.push(r.userId);
  }
  return [...map.values()];
}

// viewerId berilsa — shu foydalanuvchi uchun imzolangan havolalar ham.
function attachmentOut(a, viewerId) {
  const out = {
    id: a.id,
    name: a.originalName,
    mime: a.mime,
    size: a.size,
    kind: a.kind,
    width: a.width,
    height: a.height,
    durationSec: a.durationSec,
    hasThumb: Boolean(a.thumbKey),
    expired: Boolean(a.expiredAt),
  };
  if (viewerId && !a.expiredAt) Object.assign(out, attachmentUrls(a, viewerId));
  return out;
}

function attachmentUrls(a, viewerId) {
  return {
    url: mediaUrl(viewerId, a.id, 'full'),
    thumbUrl: a.thumbKey ? mediaUrl(viewerId, a.id, 'thumb') : null,
  };
}

function serializeMessage(m, viewerId) {
  const base = {
    id: m.id,
    roomId: m.roomId,
    senderId: m.senderId,
    sender: m.sender ? { id: m.sender.id, fullName: m.sender.fullName } : null,
    type: m.type,
    clientId: m.clientId,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    forwardedFromId: m.forwardedFromId,
  };
  if (m.deletedAt) return { ...base, body: null, meta: null, replyTo: null, reactions: [], attachments: [] };
  return {
    ...base,
    body: m.body,
    meta: m.meta,
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          senderId: m.replyTo.senderId,
          senderName: m.replyTo.sender?.fullName || null,
          type: m.replyTo.type,
          body: m.replyTo.deletedAt ? null : (m.replyTo.body || '').slice(0, 200),
          deleted: Boolean(m.replyTo.deletedAt),
        }
      : null,
    reactions: aggregateReactions(m.reactions),
    attachments: (m.attachments || []).map((a) => attachmentOut(a, viewerId)),
  };
}

const notHiddenFor = (userId) => ({ hiddenFor: { none: { userId } } });

// Kursor: xabar id'si; tartib (createdAt, id).
async function cursorOf(roomId, id) {
  if (!id) return null;
  const m = await prisma.chatMessage.findFirst({ where: { id: String(id), roomId }, select: { id: true, createdAt: true } });
  if (!m) throw badRequest("Kursor noto'g'ri.");
  return m;
}

const before = (c) => ({ OR: [{ createdAt: { lt: c.createdAt } }, { createdAt: c.createdAt, id: { lt: c.id } }] });
const after = (c) => ({ OR: [{ createdAt: { gt: c.createdAt } }, { createdAt: c.createdAt, id: { gt: c.id } }] });
const DESC = [{ createdAt: 'desc' }, { id: 'desc' }];
const ASC = [{ createdAt: 'asc' }, { id: 'asc' }];

// ?before= (yuqoriga), ?after= (uzilishdan keyin to'ldirish),
// ?around= (qidiruv/javobdan xabarga o'tish: atrofidagi sahifa).
async function listMessages(user, roomId, opts = {}) {
  await requireMember(roomId, user.id);
  const take = Math.min(Math.max(Number(opts.limit) || 40, 1), 100);
  const base = { roomId, ...notHiddenFor(user.id) };
  const find = (where, orderBy, n) => prisma.chatMessage.findMany({ where, orderBy, take: n, include: MESSAGE_INCLUDE });
  const out = (rows) => rows.map((m) => serializeMessage(m, user.id));

  if (opts.around) {
    const c = await cursorOf(roomId, opts.around);
    const half = Math.floor(take / 2);
    const [older, anchorAndNewer] = await Promise.all([
      find({ ...base, ...before(c) }, DESC, half + 1),
      find({ ...base, OR: [{ id: c.id }, ...after(c).OR] }, ASC, half + 1),
    ]);
    const hasMore = older.length > half;
    const hasNewer = anchorAndNewer.length > half;
    return {
      items: out([...older.slice(0, half).reverse(), ...anchorAndNewer.slice(0, half)]),
      hasMore,
      hasNewer,
    };
  }
  if (opts.after) {
    const c = await cursorOf(roomId, opts.after);
    const rows = await find({ ...base, ...after(c) }, ASC, take + 1);
    return { items: out(rows.slice(0, take)), hasMore: false, hasNewer: rows.length > take };
  }
  const where = opts.before ? { ...base, ...before(await cursorOf(roomId, opts.before)) } : base;
  const rows = await find(where, DESC, take + 1);
  return { items: out(rows.slice(0, take).reverse()), hasMore: rows.length > take, hasNewer: false };
}

function cleanBody(body, { required }) {
  if (body === undefined || body === null) {
    if (required) throw badRequest("Xabar bo'sh.");
    return null;
  }
  if (typeof body !== 'string') throw badRequest("Xabar noto'g'ri.");
  const text = body.replace(/\r\n/g, '\n').trim();
  if (!text && required) throw badRequest("Xabar bo'sh.");
  if (text.length > MAX_BODY) throw badRequest(`Xabar ${MAX_BODY} belgidan oshmasin.`);
  return text || null;
}

// @eslatmalar: faqat shu xona a'zolari qoladi.
async function cleanMentions(roomId, mentions) {
  if (!Array.isArray(mentions) || !mentions.length) return [];
  const ids = [...new Set(mentions.filter((x) => typeof x === 'string'))].slice(0, 50);
  const found = await prisma.chatMember.findMany({ where: { roomId, userId: { in: ids }, leftAt: null }, select: { userId: true } });
  return found.map((f) => f.userId);
}

const num = (v, min, max) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, min), max) : undefined);

// Ovozli xabar to'lqini: ~48 ta 0..1 son.
function cleanWaveform(w) {
  if (!Array.isArray(w)) return undefined;
  return w.slice(0, 64).map((x) => Math.round((num(Number(x), 0, 1) || 0) * 100) / 100);
}

async function loadSerialized(id, viewerId) {
  return serializeMessage(await prisma.chatMessage.findUnique({ where: { id }, include: MESSAGE_INCLUDE }), viewerId);
}

const MEDIA_RULES = {
  TEXT: { min: 0, max: 0 },
  IMAGE: { min: 1, max: MAX_ATTACHMENTS, kinds: ['IMAGE'] },
  VIDEO: { min: 1, max: 1, kinds: ['VIDEO'] },
  FILE: { min: 1, max: MAX_ATTACHMENTS, kinds: ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'] },
  VOICE: { min: 1, max: 1, kinds: ['AUDIO'] },
  VIDEO_NOTE: { min: 1, max: 1, kinds: ['VIDEO'] },
  STICKER: { min: 0, max: 0 },
};

// Xabar turi + biriktirmalar + meta tekshiruvi. Qaytaradi: { body, meta, attachmentIds }.
async function prepareContent(user, roomId, input) {
  const type = input.type || 'TEXT';
  const rule = MEDIA_RULES[type];
  if (!rule) throw badRequest("Xabar turi noto'g'ri.");
  const ids = Array.isArray(input.attachmentIds) ? [...new Set(input.attachmentIds.map(String))] : [];
  if (ids.length < rule.min || ids.length > rule.max) throw badRequest("Biriktirmalar soni noto'g'ri.");

  const meta = {};
  const mentions = await cleanMentions(roomId, input.mentions);
  if (mentions.length) meta.mentions = mentions;

  let body = null;
  if (type === 'TEXT') body = cleanBody(input.body, { required: true });
  else if (['IMAGE', 'VIDEO', 'FILE'].includes(type)) body = cleanBody(input.body, { required: false });

  if (type === 'STICKER') {
    const stickerId = input.meta?.stickerId;
    const sticker =
      typeof stickerId === 'string'
        ? await prisma.sticker.findFirst({ where: { id: stickerId, pack: { isActive: true } }, select: { id: true } })
        : null;
    if (!sticker) throw badRequest('Stiker topilmadi.');
    meta.stickerId = sticker.id;
  }

  let attachments = [];
  if (ids.length) {
    attachments = await prisma.chatAttachment.findMany({
      where: { id: { in: ids }, uploaderId: user.id, status: 'PENDING', messageId: null },
    });
    if (attachments.length !== ids.length) throw badRequest('Fayl topilmadi yoki allaqachon yuborilgan.');
    if (attachments.some((a) => !rule.kinds.includes(a.kind))) throw badRequest("Fayl turi xabar turiga mos emas.");
  }

  if (type === 'VOICE' || type === 'VIDEO_NOTE') {
    const settings = await getSettings();
    const limit = type === 'VOICE' ? settings.maxVoiceSeconds : settings.maxVideoNoteSeconds;
    const duration = num(Number(input.meta?.duration ?? attachments[0].durationSec), 0, 100000);
    if (!duration || duration > limit + 2) throw badRequest(`Davomiylik ${limit} soniyadan oshmasin.`);
    meta.duration = Math.round(duration * 10) / 10;
    if (type === 'VOICE') {
      const wf = cleanWaveform(input.meta?.waveform);
      if (wf) meta.waveform = wf;
    }
  }
  return { type, body, meta: Object.keys(meta).length ? meta : undefined, attachmentIds: attachments.map((a) => a.id) };
}

// Idempotent yuborish: (senderId, clientId) unique. Takror kelgan so'rov
// yangi xabar yaratmaydi — mavjudini qaytaradi.
async function sendMessage(user, roomId, input = {}) {
  const clientId = typeof input.clientId === 'string' && CLIENT_ID_RE.test(input.clientId) ? input.clientId : null;
  if (!clientId) throw badRequest("clientId noto'g'ri.");
  if (typeof roomId !== 'string') throw notFound('Xona topilmadi.');

  const existing = await prisma.chatMessage.findUnique({
    where: { senderId_clientId: { senderId: user.id, clientId } },
    select: { id: true, roomId: true },
  });
  if (existing) {
    if (existing.roomId !== roomId) throw badRequest('clientId boshqa xonada ishlatilgan.');
    return { message: await loadSerialized(existing.id, user.id), duplicate: true };
  }

  await requireWriter(roomId, user);
  const content = await prepareContent(user, roomId, input);
  consume('message', user.id);

  let replyToId = null;
  if (input.replyToId) {
    const target = await prisma.chatMessage.findFirst({ where: { id: String(input.replyToId), roomId }, select: { id: true } });
    if (!target) throw badRequest('Javob berilayotgan xabar topilmadi.');
    replyToId = target.id;
  }

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: { roomId, senderId: user.id, type: content.type, body: content.body, replyToId, clientId, meta: content.meta },
      });
      if (content.attachmentIds.length) {
        const { count } = await tx.chatAttachment.updateMany({
          where: { id: { in: content.attachmentIds }, status: 'PENDING', messageId: null },
          data: { messageId: msg.id, status: 'ATTACHED' },
        });
        if (count !== content.attachmentIds.length) throw badRequest('Fayl allaqachon yuborilgan.');
      }
      return tx.chatMessage.findUnique({ where: { id: msg.id }, include: MESSAGE_INCLUDE });
    });
  } catch (err) {
    if (err.code === 'P2002') {
      const again = await prisma.chatMessage.findUnique({ where: { senderId_clientId: { senderId: user.id, clientId } }, select: { id: true } });
      return { message: await loadSerialized(again.id, user.id), duplicate: true };
    }
    throw err;
  }
  // Yuboruvchi o'z xabarini o'qigan hisoblanadi.
  await prisma.chatMember.updateMany({
    where: { roomId, userId: user.id },
    data: { lastReadAt: created.createdAt, lastReadMessageId: created.id },
  });
  chatEvents.emit('message:new', { roomId, message: serializeMessage(created) });
  return { message: serializeMessage(created, user.id), duplicate: false };
}

// Tizim xabari (a'zo qo'shildi, nom o'zgardi ...). Matnda faqat ismlar.
async function systemMessage(roomId, actorId, body, meta) {
  const created = await prisma.chatMessage.create({
    data: { roomId, senderId: actorId, type: 'SYSTEM', body: body.slice(0, MAX_BODY), meta, clientId: `sys-${crypto.randomUUID()}` },
    include: MESSAGE_INCLUDE,
  });
  const message = serializeMessage(created);
  chatEvents.emit('message:new', { roomId, message });
  return message;
}

const minutesSince = (date) => (Date.now() - new Date(date).getTime()) / 60000;
const EDITABLE = ['TEXT', 'IMAGE', 'VIDEO', 'FILE'];

async function editMessage(user, messageId, input = {}) {
  const { message, member } = await requireMessage(messageId, user.id);
  if (message.senderId !== user.id) throw forbidden("Faqat o'z xabaringizni tahrirlay olasiz.");
  if (message.deletedAt) throw badRequest("Xabar o'chirilgan.");
  if (!EDITABLE.includes(message.type)) throw badRequest("Bu xabarni tahrirlab bo'lmaydi.");
  if (member.room.isArchived) throw forbidden('Xona arxivlangan.');
  const settings = await getSettings();
  if (minutesSince(message.createdAt) > settings.editWindowMinutes) throw forbidden("Tahrirlash muddati o'tgan.");
  const body = cleanBody(input.body, { required: message.type === 'TEXT' });
  if (body === message.body) return loadSerialized(message.id, user.id);

  const updated = await prisma.chatMessage.update({ where: { id: message.id }, data: { body, editedAt: new Date() }, include: MESSAGE_INCLUDE });
  chatEvents.emit('message:updated', { roomId: message.roomId, message: serializeMessage(updated) });
  return serializeMessage(updated, user.id);
}

// scope 'me': faqat o'zidan yashiradi (har doim mumkin).
// scope 'all': o'z xabari muddat ichida; yoki SUPER_ADMIN — DIRECT bo'lmagan
// xonalarda. Fayllar diskdan ham o'chiriladi; xabar o'rnida "Xabar o'chirildi".
async function deleteMessage(user, messageId, scope = 'me') {
  const { message, member } = await requireMessage(messageId, user.id);

  if (scope === 'me') {
    await prisma.chatMessageHidden.upsert({
      where: { messageId_userId: { messageId: message.id, userId: user.id } },
      create: { messageId: message.id, userId: user.id },
      update: {},
    });
    chatEvents.emit('message:deleted', { roomId: message.roomId, messageId: message.id, forUserId: user.id });
    return { id: message.id, scope: 'me' };
  }
  if (scope !== 'all') throw badRequest("Noto'g'ri amal.");
  if (message.deletedAt) return { id: message.id, scope: 'all' };

  const settings = await getSettings();
  const own = message.senderId === user.id && message.type !== 'SYSTEM';
  const ownInWindow = own && minutesSince(message.createdAt) <= settings.deleteForAllWindowMinutes;
  const moderator = user.role === 'SUPER_ADMIN' && member.room.type !== 'DIRECT';
  if (!ownInWindow && !moderator) {
    throw forbidden(own ? "Hamma uchun o'chirish muddati o'tgan. Faqat o'zingizdan o'chirishingiz mumkin." : "Bu xabarni hamma uchun o'chira olmaysiz.");
  }

  const attachments = await prisma.chatAttachment.findMany({ where: { messageId: message.id }, select: { storageKey: true, thumbKey: true } });
  await prisma.$transaction([
    prisma.chatReaction.deleteMany({ where: { messageId: message.id } }),
    prisma.chatPinned.deleteMany({ where: { messageId: message.id } }),
    prisma.chatAttachment.deleteMany({ where: { messageId: message.id } }),
    prisma.chatMessage.update({ where: { id: message.id }, data: { deletedAt: new Date(), body: null, meta: Prisma.DbNull } }),
  ]);
  await removeKeys(attachments.flatMap((a) => [a.storageKey, a.thumbKey]));
  chatEvents.emit('message:deleted', { roomId: message.roomId, messageId: message.id });
  return { id: message.id, scope: 'all' };
}

async function toggleReaction(user, messageId, emoji) {
  if (typeof emoji !== 'string' || !emoji || emoji.length > 16 || !EMOJI_RE.test(emoji) || /[\sA-Za-z0-9<>]/.test(emoji)) {
    throw badRequest("Reaksiya noto'g'ri.");
  }
  const { message, member } = await requireMessage(messageId, user.id);
  if (message.deletedAt || message.type === 'SYSTEM') throw badRequest("Bu xabarga reaksiya qo'yib bo'lmaydi.");
  if (member.room.isArchived) throw forbidden('Xona arxivlangan.');

  const key = { messageId_userId_emoji: { messageId: message.id, userId: user.id, emoji } };
  const existing = await prisma.chatReaction.findUnique({ where: key });
  if (existing) {
    await prisma.chatReaction.delete({ where: key });
  } else {
    const mine = await prisma.chatReaction.count({ where: { messageId: message.id, userId: user.id } });
    if (mine >= MAX_REACTIONS_PER_USER) throw badRequest(`Bitta xabarga ko'pi bilan ${MAX_REACTIONS_PER_USER} ta reaksiya.`);
    await prisma.chatReaction.create({ data: { messageId: message.id, userId: user.id, emoji } }).catch((err) => {
      if (err.code !== 'P2002') throw err;
    });
  }
  const list = await prisma.chatReaction.findMany({ where: { messageId: message.id }, select: { emoji: true, userId: true }, orderBy: { createdAt: 'asc' } });
  const reactions = aggregateReactions(list);
  chatEvents.emit('reaction:updated', { roomId: message.roomId, messageId: message.id, reactions });
  return { messageId: message.id, reactions };
}

// Kim qadashi mumkin: shaxsiy xonada ikkalasi; guruhda OWNER/ADMIN;
// Umumiy/E'lonlar/Laboratoriyada SUPER_ADMIN va MANAGER.
function canPin(member, role) {
  const type = member.room.type;
  if (type === 'DIRECT') return true;
  if (type === 'GROUP') return ['OWNER', 'ADMIN'].includes(member.role);
  return ANNOUNCERS.includes(role);
}

async function pinMessage(user, messageId, pinned = true) {
  const { message, member } = await requireMessage(messageId, user.id);
  if (!canPin(member, user.role)) throw forbidden("Xabarni qadash uchun ruxsat yo'q.");
  if (pinned) {
    if (message.deletedAt || message.type === 'SYSTEM') throw badRequest("Bu xabarni qadab bo'lmaydi.");
    const count = await prisma.chatPinned.count({ where: { roomId: message.roomId } });
    if (count >= MAX_PINS) throw badRequest(`Ko'pi bilan ${MAX_PINS} ta xabar qadaladi.`);
    await prisma.chatPinned.upsert({
      where: { roomId_messageId: { roomId: message.roomId, messageId: message.id } },
      create: { roomId: message.roomId, messageId: message.id, pinnedById: user.id },
      update: {},
    });
  } else {
    await prisma.chatPinned.deleteMany({ where: { roomId: message.roomId, messageId: message.id } });
  }
  chatEvents.emit('room:updated', { roomId: message.roomId, pins: true });
  return listPins(user, message.roomId);
}

async function listPins(user, roomId) {
  await requireMember(roomId, user.id);
  const pins = await prisma.chatPinned.findMany({
    where: { roomId, message: { deletedAt: null, ...notHiddenFor(user.id) } },
    orderBy: { createdAt: 'desc' },
    include: { message: { include: MESSAGE_INCLUDE } },
  });
  return pins.map((p) => ({ pinnedAt: p.createdAt, pinnedById: p.pinnedById, message: serializeMessage(p.message, user.id) }));
}

// O'qildi belgisi faqat oldinga siljiydi.
async function markRead(user, roomId, messageId) {
  const member = await requireMember(roomId, user.id);
  const target = messageId
    ? await prisma.chatMessage.findFirst({ where: { id: String(messageId), roomId }, select: { id: true, createdAt: true } })
    : await prisma.chatMessage.findFirst({ where: { roomId }, orderBy: DESC, select: { id: true, createdAt: true } });
  if (!target) return { roomId, lastReadAt: member.lastReadAt, lastReadMessageId: member.lastReadMessageId };
  if (member.lastReadAt && member.lastReadAt >= target.createdAt) {
    return { roomId, lastReadAt: member.lastReadAt, lastReadMessageId: member.lastReadMessageId };
  }
  await prisma.chatMember.update({ where: { id: member.id }, data: { lastReadAt: target.createdAt, lastReadMessageId: target.id } });
  chatEvents.emit('room:read-by', { roomId, userId: user.id, messageId: target.id, readAt: target.createdAt });
  return { roomId, lastReadAt: target.createdAt, lastReadMessageId: target.id };
}

// Faqat o'z (faol) xonalarida, o'chirilmagan va yashirilmagan xabarlar.
async function searchMessages(user, { q, roomId, offset, limit } = {}) {
  const text = typeof q === 'string' ? q.trim() : '';
  if (text.length < 2) throw badRequest('Kamida 2 ta belgi kiriting.');
  if (text.length > 100) throw badRequest('Qidiruv matni juda uzun.');
  const take = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const skip = Math.max(Number(offset) || 0, 0);
  const where = {
    deletedAt: null,
    type: { not: 'SYSTEM' },
    OR: [
      { body: { contains: text, mode: 'insensitive' } },
      { attachments: { some: { originalName: { contains: text, mode: 'insensitive' } } } },
    ],
    room: { members: { some: { userId: user.id, leftAt: null } } },
    ...notHiddenFor(user.id),
  };
  if (roomId) {
    await requireMember(String(roomId), user.id);
    where.roomId = String(roomId);
  }
  const rows = await prisma.chatMessage.findMany({ where, orderBy: DESC, skip, take: take + 1, include: MESSAGE_INCLUDE });
  return { items: rows.slice(0, take).map((m) => serializeMessage(m, user.id)), hasMore: rows.length > take, nextOffset: skip + take };
}

// Imzolangan havolalar (socket orqali kelgan yangi xabarlar va muddati
// tugaganlar uchun). Har bir fayl uchun a'zolik qayta tekshiriladi.
async function mediaUrls(user, ids) {
  const list = Array.isArray(ids) ? [...new Set(ids.map(String))].slice(0, 200) : [];
  if (!list.length) return { items: {} };
  const rows = await prisma.chatAttachment.findMany({
    where: { id: { in: list }, expiredAt: null },
    select: { id: true, thumbKey: true, uploaderId: true, status: true, message: { select: { roomId: true, deletedAt: true } } },
  });
  const roomIds = [...new Set(rows.map((r) => r.message?.roomId).filter(Boolean))];
  const memberships = await prisma.chatMember.findMany({
    where: { userId: user.id, leftAt: null, roomId: { in: roomIds } },
    select: { roomId: true },
  });
  const allowedRooms = new Set(memberships.map((m) => m.roomId));
  const items = {};
  for (const a of rows) {
    const ok = a.message ? !a.message.deletedAt && allowedRooms.has(a.message.roomId) : a.status === 'PENDING' && a.uploaderId === user.id;
    if (ok) items[a.id] = attachmentUrls(a, user.id);
  }
  return { items };
}

// Ulashish: nusxa maqsad xonalarda yangi xabar bo'ladi; fayllar diskda
// nusxalanadi (asl xabar o'chirilsa nusxa qoladi va aksincha).
async function forwardMessage(user, messageId, roomIds) {
  const targets = Array.isArray(roomIds) ? [...new Set(roomIds.map(String))] : [];
  if (!targets.length || targets.length > MAX_FORWARD_TARGETS) throw badRequest(`1–${MAX_FORWARD_TARGETS} ta xonani tanlang.`);
  const { message } = await requireMessage(messageId, user.id, { sender: { select: { fullName: true } }, attachments: true });
  if (message.deletedAt || message.type === 'SYSTEM') throw badRequest("Bu xabarni ulashib bo'lmaydi.");
  for (const roomId of targets) await requireWriter(roomId, user);

  const origin = message.forwardedFromId ? message.meta?.forwardedFrom : { senderName: message.sender?.fullName || null };
  const meta = { ...(message.meta && typeof message.meta === 'object' ? message.meta : {}), forwardedFrom: origin };
  delete meta.mentions;
  const files = message.attachments.filter((a) => !a.expiredAt);

  const results = [];
  for (const roomId of targets) {
    consume('message', user.id);
    const copies = [];
    for (const a of files) {
      const storageKey = newKey();
      await fs.promises.copyFile(resolveKey(a.storageKey), resolveKey(storageKey));
      let thumbKey = null;
      if (a.thumbKey) {
        thumbKey = `${storageKey}-t`;
        await fs.promises.copyFile(resolveKey(a.thumbKey), resolveKey(thumbKey)).catch(() => (thumbKey = null));
      }
      copies.push({ ...a, storageKey, thumbKey });
    }
    const created = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: user.id,
        type: message.type,
        body: message.body,
        meta,
        forwardedFromId: message.forwardedFromId || message.id,
        clientId: `fwd-${crypto.randomUUID()}`,
        attachments: {
          create: copies.map((a) => ({
            uploaderId: user.id,
            storageKey: a.storageKey,
            thumbKey: a.thumbKey,
            originalName: a.originalName,
            mime: a.mime,
            size: a.size,
            kind: a.kind,
            width: a.width,
            height: a.height,
            durationSec: a.durationSec,
            status: 'ATTACHED',
          })),
        },
      },
      include: MESSAGE_INCLUDE,
    });
    await prisma.chatMember.updateMany({ where: { roomId, userId: user.id }, data: { lastReadAt: created.createdAt, lastReadMessageId: created.id } });
    chatEvents.emit('message:new', { roomId, message: serializeMessage(created) });
    results.push(serializeMessage(created, user.id));
  }
  return { items: results };
}

module.exports = {
  MESSAGE_INCLUDE,
  serializeMessage,
  attachmentOut,
  listMessages,
  sendMessage,
  systemMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  pinMessage,
  listPins,
  markRead,
  searchMessages,
  mediaUrls,
  forwardMessage,
};
