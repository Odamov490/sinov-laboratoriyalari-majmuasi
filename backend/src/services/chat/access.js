const prisma = require('../../config/prisma');
const { notFound, forbidden } = require('./errors');
const { isChatActive } = require('./membership');

// Har bir REST so'rov va socket hodisasi shu yerdan o'tadi: tekshiruv rol
// emas, a'zolik bo'yicha. SUPER_ADMIN uchun ham istisno yo'q — shaxsiy
// (DIRECT) xonalarni o'qishning hech qanday yo'li mavjud emas.
const PEER_SELECT = { id: true, fullName: true, isActive: true, deletedAt: true, chatEnabled: true, lastSeenAt: true };
const ANNOUNCERS = ['SUPER_ADMIN', 'MANAGER'];

// Faol a'zolik + xona; a'zo bo'lmasa 404.
async function requireMember(roomId, userId) {
  if (typeof roomId !== 'string' || roomId.length > 64) throw notFound('Xona topilmadi.');
  const member = await prisma.chatMember.findFirst({
    where: { roomId, userId, leftAt: null },
    include: { room: { include: { laboratory: { select: { nameUz: true } } } } },
  });
  if (!member) throw notFound('Xona topilmadi.');
  return member;
}

// DIRECT xonadagi ikkinchi odam.
async function directPeer(roomId, userId) {
  const other = await prisma.chatMember.findFirst({
    where: { roomId, userId: { not: userId } },
    select: { user: { select: PEER_SELECT } },
  });
  return other?.user || null;
}

// Xonaga yozish mumkinmi va bo'lmasa nega.
function writeState(room, role, peer) {
  if (room.isArchived) return { canWrite: false, reason: 'Xona arxivlangan.' };
  if (room.type === 'ANNOUNCEMENT' && !ANNOUNCERS.includes(role)) {
    return { canWrite: false, reason: "E'lonlarni faqat rahbariyat yozadi." };
  }
  if (room.type === 'DIRECT' && !isChatActive(peer)) return { canWrite: false, reason: 'Foydalanuvchi faol emas.' };
  return { canWrite: true, reason: null };
}

async function requireWriter(roomId, user) {
  const member = await requireMember(roomId, user.id);
  const peer = member.room.type === 'DIRECT' ? await directPeer(roomId, user.id) : null;
  const state = writeState(member.room, user.role, peer);
  if (!state.canWrite) throw forbidden(state.reason);
  return member;
}

// Xabar + uni ko'rish huquqi (yuboruvchining xonasiga a'zolik).
async function requireMessage(messageId, userId, include) {
  if (typeof messageId !== 'string' || messageId.length > 64) throw notFound('Xabar topilmadi.');
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId }, include });
  if (!message) throw notFound('Xabar topilmadi.');
  const member = await requireMember(message.roomId, userId).catch(() => null);
  if (!member) throw notFound('Xabar topilmadi.');
  return { message, member };
}

const roomTitle = (room, peer) => {
  if (room.type === 'GENERAL') return 'Umumiy';
  if (room.type === 'ANNOUNCEMENT') return "E'lonlar";
  if (room.type === 'LABORATORY') return room.laboratory?.nameUz || room.title || 'Laboratoriya';
  if (room.type === 'DIRECT') return peer?.fullName || 'Foydalanuvchi';
  return room.title || 'Guruh';
};

module.exports = { requireMember, requireWriter, requireMessage, directPeer, writeState, roomTitle, PEER_SELECT, ANNOUNCERS };
