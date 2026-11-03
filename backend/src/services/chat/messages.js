const crypto = require('crypto');
const { Prisma } = require('@prisma/client');
const prisma = require('../../config/prisma');
const { chatEvents } = require('./events');
const { getSettings } = require('./settings');
const { consume } = require('./rateLimit');
const { removeKeys } = require('./storage');
const { requireMember, requireWriter, requireMessage, ANNOUNCERS } = require('./access');
const { notFound, forbidden, badRequest } = require('./errors');

// Xabarlar bilan ishlaydigan yagona servis: REST ham, socket ham shu
// funksiyalarni chaqiradi. Matn va fayl nomlari hech qachon loglanmaydi.
const MAX_BODY = 4000;
const CLIENT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const MAX_REACTIONS_PER_USER = 3;
const MAX_PINS = 20;

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, fullName: true } },
  replyTo: {
    select: { id: true, senderId: true, type: true, body: true, deletedAt: true, sender: { select: { fullName: true } } },
  },
  reactions: { select: { emoji: true, userId: true }, orderBy: { createdAt: 'asc' } },
  attachments: {
    select: {
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
    },
  },
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

function serializeMessage(m) {
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
    attachments: (m.attachments || []).map((a) => ({
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
    })),
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

async function listMessages(user, roomId, { before, after, limit } = {}) {
  await requireMember(roomId, user.id);
  const take = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const where = { roomId, ...notHiddenFor(user.id) };
  let orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
  if (after) {
    const c = await cursorOf(roomId, after);
    where.OR = [{ createdAt: { gt: c.createdAt } }, { createdAt: c.createdAt, id: { gt: c.id } }];
    orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
  } else if (before) {
    const c = await cursorOf(roomId, before);
    where.OR = [{ createdAt: { lt: c.createdAt } }, { createdAt: c.createdAt, id: { lt: c.id } }];
  }
  const rows = await prisma.chatMessage.findMany({ where, orderBy, take: take + 1, include: MESSAGE_INCLUDE });
  const hasMore = rows.length > take;
  const page = rows.slice(0, take);
  if (!after) page.reverse();
  return { items: page.map(serializeMessage), hasMore };
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

async function loadSerialized(id) {
  return serializeMessage(await prisma.chatMessage.findUnique({ where: { id }, include: MESSAGE_INCLUDE }));
}

// Idempotent yuborish: (senderId, clientId) unique. Takror kelgan so'rov
// yangi xabar yaratmaydi — mavjudini qaytaradi.
async function sendMessage(user, roomId, input = {}) {
  const clientId = typeof input.clientId === 'string' && CLIENT_ID_RE.test(input.clientId) ? input.clientId : null;
  if (!clientId) throw badRequest("clientId noto'g'ri.");

  const existing = await prisma.chatMessage.findUnique({ where: { senderId_clientId: { senderId: user.id, clientId } }, select: { id: true, roomId: true } });
  if (existing) {
    if (existing.roomId !== roomId) throw badRequest("clientId boshqa xonada ishlatilgan.");
    return { message: await loadSerialized(existing.id), duplicate: true };
  }

  await requireWriter(roomId, user);
  consume('message', user.id);

  const type = input.type || 'TEXT';
  if (type !== 'TEXT') throw badRequest("Bu turdagi xabar hali qo'llab-quvvatlanmaydi.");
  const body = cleanBody(input.body, { required: true });

  let replyToId = null;
  if (input.replyToId) {
    const target = await prisma.chatMessage.findFirst({ where: { id: String(input.replyToId), roomId }, select: { id: true } });
    if (!target) throw badRequest('Javob berilayotgan xabar topilmadi.');
    replyToId = target.id;
  }
  const mentions = await cleanMentions(roomId, input.mentions);

  let created;
  try {
    created = await prisma.chatMessage.create({
      data: { roomId, senderId: user.id, type, body, replyToId, clientId, meta: mentions.length ? { mentions } : undefined },
      include: MESSAGE_INCLUDE,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      const again = await prisma.chatMessage.findUnique({ where: { senderId_clientId: { senderId: user.id, clientId } }, select: { id: true } });
      return { message: await loadSerialized(again.id), duplicate: true };
    }
    throw err;
  }
  const message = serializeMessage(created);
  // Yuboruvchi o'z xabarini o'qigan hisoblanadi.
  await prisma.chatMember.updateMany({
    where: { roomId, userId: user.id },
    data: { lastReadAt: created.createdAt, lastReadMessageId: created.id },
  });
  chatEvents.emit('message:new', { roomId, message });
  return { message, duplicate: false };
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
  if (body === message.body) return loadSerialized(message.id);

  const updated = await prisma.chatMessage.update({ where: { id: message.id }, data: { body, editedAt: new Date() }, include: MESSAGE_INCLUDE });
  const result = serializeMessage(updated);
  chatEvents.emit('message:updated', { roomId: message.roomId, message: result });
  return result;
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
  chatEvents.emit('room:updated', { roomId: message.roomId });
  return listPins(user, message.roomId);
}

async function listPins(user, roomId) {
  await requireMember(roomId, user.id);
  const pins = await prisma.chatPinned.findMany({
    where: { roomId, message: { deletedAt: null, ...notHiddenFor(user.id) } },
    orderBy: { createdAt: 'desc' },
    include: { message: { include: MESSAGE_INCLUDE } },
  });
  return pins.map((p) => ({ pinnedAt: p.createdAt, pinnedById: p.pinnedById, message: serializeMessage(p.message) }));
}

// O'qildi belgisi faqat oldinga siljiydi.
async function markRead(user, roomId, messageId) {
  const member = await requireMember(roomId, user.id);
  const target = messageId
    ? await prisma.chatMessage.findFirst({ where: { id: String(messageId), roomId }, select: { id: true, createdAt: true } })
    : await prisma.chatMessage.findFirst({ where: { roomId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, createdAt: true } });
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
    body: { contains: text, mode: 'insensitive' },
    room: { members: { some: { userId: user.id, leftAt: null } } },
    ...notHiddenFor(user.id),
  };
  if (roomId) {
    await requireMember(String(roomId), user.id);
    where.roomId = String(roomId);
  }
  const rows = await prisma.chatMessage.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: take + 1,
    include: MESSAGE_INCLUDE,
  });
  return { items: rows.slice(0, take).map(serializeMessage), hasMore: rows.length > take, nextOffset: skip + take };
}

module.exports = {
  MESSAGE_INCLUDE,
  serializeMessage,
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
};
