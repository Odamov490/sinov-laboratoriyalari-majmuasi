const prisma = require('../../config/prisma');
const { effectiveLabId } = require('../../utils/accounts');
const { chatEvents } = require('./events');

// Tizim xonalari a'zoligi (Umumiy, E'lonlar, Laboratoriya) har doim shu
// yerda hisoblanadi — boshqa joyda qo'lda o'zgartirilmaydi:
//  - faol va chatEnabled foydalanuvchi Umumiy va E'lonlar a'zosi;
//  - laboratoriya xonasi: hisobning laboratoriyasi (o'z labId'si yoki
//    bog'langan mutaxassis kartasining laboratoriyasi);
//  - nofaol / o'chirilgan / chat o'chirilgan foydalanuvchi tizim
//    xonalaridan chiqariladi (xabarlari qoladi). Guruh va shaxsiy xonalar
//    a'zoligi saqlanadi — qayta faollashganda tiklanadi.
const SYSTEM_TYPES = ['GENERAL', 'ANNOUNCEMENT', 'LABORATORY'];

async function singletonRoom(type, title) {
  const found = await prisma.chatRoom.findFirst({ where: { type } });
  if (found) return found;
  try {
    return await prisma.chatRoom.create({ data: { type, title } });
  } catch (err) {
    // Parallel yaratishda unique indeks — mavjudini olamiz.
    if (err.code === 'P2002') return prisma.chatRoom.findFirst({ where: { type } });
    throw err;
  }
}

// "Yo'q bo'lsa yaratish": laboratoriya xonasi.
async function ensureLabRoom(laboratoryId) {
  const found = await prisma.chatRoom.findUnique({ where: { laboratoryId } });
  if (found) return found;
  try {
    return await prisma.chatRoom.create({ data: { type: 'LABORATORY', laboratoryId } });
  } catch (err) {
    if (err.code === 'P2002') return prisma.chatRoom.findUnique({ where: { laboratoryId } });
    throw err;
  }
}

const isChatActive = (u) => Boolean(u && u.isActive && !u.deletedAt && u.chatEnabled);

async function join(roomId, userId) {
  await prisma.chatMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId, role: 'MEMBER' },
    update: { leftAt: null },
  });
}

// Bitta foydalanuvchining tizim xonalari a'zoligini haqiqatga moslaydi.
// Qaytaradi: o'zgarish bo'ldimi.
async function syncUserMemberships(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      deletedAt: true,
      chatEnabled: true,
      labId: true,
      staff: { select: { laboratoryId: true, isActive: true } },
    },
  });
  if (!user) return false;

  const current = await prisma.chatMember.findMany({
    where: { userId, leftAt: null, room: { type: { in: SYSTEM_TYPES } } },
    select: { id: true, roomId: true, room: { select: { type: true, laboratoryId: true } } },
  });

  const wanted = new Set();
  if (isChatActive(user)) {
    const general = await singletonRoom('GENERAL', 'Umumiy');
    const announce = await singletonRoom('ANNOUNCEMENT', "E'lonlar");
    wanted.add(general.id);
    wanted.add(announce.id);
    const labId = effectiveLabId(user);
    if (labId) {
      const lab = await prisma.laboratory.findFirst({ where: { id: labId, deletedAt: null }, select: { id: true } });
      if (lab) wanted.add((await ensureLabRoom(lab.id)).id);
    }
  }

  const have = new Set(current.map((m) => m.roomId));
  const toLeave = current.filter((m) => !wanted.has(m.roomId));
  const toJoin = [...wanted].filter((id) => !have.has(id));

  if (toLeave.length) {
    await prisma.chatMember.updateMany({ where: { id: { in: toLeave.map((m) => m.id) } }, data: { leftAt: new Date() } });
  }
  for (const roomId of toJoin) await join(roomId, userId);

  const changed = toLeave.length > 0 || toJoin.length > 0;
  if (changed) {
    chatEvents.emit('membership:changed', { userId });
    for (const roomId of [...toJoin, ...toLeave.map((m) => m.roomId)]) chatEvents.emit('room:updated', { roomId });
  }
  if (!isChatActive(user)) chatEvents.emit('user:disabled', { userId });
  return changed;
}

// Hisob/mutaxassis o'zgargan joylardan chaqiriladi; chat xatosi asosiy
// amalni buzmasin (faqat xato kodi loglanadi).
async function syncUserSafe(userId) {
  try {
    await syncUserMemberships(userId);
  } catch (err) {
    console.error(`[chat] membership sync failed: ${err.code || err.name}`);
  }
}

// Ishga tushganda: barcha hisoblar + o'chirilgan laboratoriyalar xonasini arxivlash.
async function syncAllMemberships() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await syncUserMemberships(u.id);
  await prisma.chatRoom.updateMany({
    where: { type: 'LABORATORY', isArchived: false, OR: [{ laboratoryId: null }, { laboratory: { deletedAt: { not: null } } }] },
    data: { isArchived: true },
  });
  return users.length;
}

module.exports = { syncUserMemberships, syncUserSafe, syncAllMemberships, ensureLabRoom, isChatActive };
