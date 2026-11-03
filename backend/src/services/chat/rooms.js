const prisma = require('../../config/prisma');
const { Prisma } = require('@prisma/client');
const { chatEvents } = require('./events');
const { getSettings } = require('./settings');
const { syncUserMemberships, isChatActive } = require('./membership');
const { requireMember, directPeer, writeState, roomTitle, PEER_SELECT, ANNOUNCERS } = require('./access');
const { systemMessage } = require('./messages');
const { notFound, forbidden, badRequest } = require('./errors');

const TYPE_ORDER = { ANNOUNCEMENT: 0, GENERAL: 1, LABORATORY: 2, GROUP: 3, DIRECT: 3 };
const MAX_GROUP_MEMBERS = 500;
const FOREVER = new Date('2999-12-31T00:00:00Z');

// Tizim xonalari a'zoligi har bir foydalanuvchi uchun ko'pi bilan 5 daqiqada
// bir marta (xonalar ro'yxati ochilganda) qayta tekshiriladi.
const lastSync = new Map();
async function lazySync(userId) {
  const at = lastSync.get(userId) || 0;
  if (Date.now() - at < 5 * 60 * 1000) return;
  lastSync.set(userId, Date.now());
  await syncUserMemberships(userId);
}

const isMuted = (member) => Boolean(member.mutedUntil && member.mutedUntil > new Date());

// Xona bo'yicha o'qilmaganlar: o'zimniki, tizim, o'chirilgan va
// yashirilganlar hisoblanmaydi.
async function unreadByRoom(userId, roomIds) {
  if (!roomIds.length) return new Map();
  const rows = await prisma.$queryRaw`
    SELECT m."roomId" AS "roomId", COUNT(*)::int AS "count"
    FROM "ChatMessage" m
    JOIN "ChatMember" cm ON cm."roomId" = m."roomId" AND cm."userId" = ${userId} AND cm."leftAt" IS NULL
    WHERE m."roomId" IN (${Prisma.join(roomIds)})
      AND m."senderId" <> ${userId}
      AND m."deletedAt" IS NULL
      AND m."type" <> 'SYSTEM'
      AND m."createdAt" > COALESCE(cm."lastReadAt", cm."joinedAt")
      AND NOT EXISTS (SELECT 1 FROM "ChatMessageHidden" h WHERE h."messageId" = m."id" AND h."userId" = ${userId})
    GROUP BY m."roomId"`;
  return new Map(rows.map((r) => [r.roomId, r.count]));
}

async function lastMessages(userId, roomIds) {
  if (!roomIds.length) return new Map();
  const ids = await prisma.$queryRaw`
    SELECT DISTINCT ON (m."roomId") m."id"
    FROM "ChatMessage" m
    WHERE m."roomId" IN (${Prisma.join(roomIds)})
      AND NOT EXISTS (SELECT 1 FROM "ChatMessageHidden" h WHERE h."messageId" = m."id" AND h."userId" = ${userId})
    ORDER BY m."roomId", m."createdAt" DESC, m."id" DESC`;
  const rows = await prisma.chatMessage.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    select: {
      id: true,
      roomId: true,
      type: true,
      body: true,
      senderId: true,
      deletedAt: true,
      createdAt: true,
      sender: { select: { fullName: true } },
      attachments: { select: { kind: true }, take: 1 },
    },
  });
  return new Map(
    rows.map((m) => [
      m.roomId,
      {
        id: m.id,
        type: m.type,
        senderId: m.senderId,
        senderName: m.sender?.fullName || null,
        preview: m.deletedAt ? null : (m.body || '').slice(0, 120),
        deleted: Boolean(m.deletedAt),
        createdAt: m.createdAt,
      },
    ])
  );
}

const peerOut = (p) =>
  p ? { id: p.id, fullName: p.fullName, active: isChatActive(p), lastSeenAt: p.lastSeenAt } : null;

function roomOut(member, { peer, user, unread, lastMessage, memberCount }) {
  const room = member.room;
  const state = writeState(room, user.role, peer);
  return {
    id: room.id,
    type: room.type,
    title: roomTitle(room, peer),
    laboratoryId: room.laboratoryId,
    isArchived: room.isArchived,
    createdAt: room.createdAt,
    myRole: member.role,
    joinedAt: member.joinedAt,
    lastReadAt: member.lastReadAt,
    lastReadMessageId: member.lastReadMessageId,
    mutedUntil: isMuted(member) ? member.mutedUntil : null,
    muted: isMuted(member),
    unread: unread || 0,
    lastMessage: lastMessage || null,
    memberCount,
    peer: peerOut(peer),
    canWrite: state.canWrite,
    readOnlyReason: state.reason,
    canLeave: room.type === 'GROUP',
    canManage: room.type === 'GROUP' && ['OWNER', 'ADMIN'].includes(member.role) && !room.isArchived,
  };
}

// GET /rooms — foydalanuvchining barcha faol xonalari.
async function listRooms(user) {
  await lazySync(user.id);
  const members = await prisma.chatMember.findMany({
    where: { userId: user.id, leftAt: null },
    include: {
      room: {
        include: {
          laboratory: { select: { nameUz: true } },
          _count: { select: { members: { where: { leftAt: null } } } },
          members: { where: { userId: { not: user.id } }, take: 1, select: { user: { select: PEER_SELECT } } },
        },
      },
    },
  });
  const roomIds = members.map((m) => m.roomId);
  const [unread, last] = await Promise.all([unreadByRoom(user.id, roomIds), lastMessages(user.id, roomIds)]);

  const items = members
    // Bo'sh shaxsiy xona faqat uni o'zi ochgan odamga ko'rinadi.
    .filter((m) => m.room.type !== 'DIRECT' || last.has(m.roomId) || m.lastReadAt)
    .map((m) =>
      roomOut(m, {
        peer: m.room.type === 'DIRECT' ? m.room.members[0]?.user || null : null,
        user,
        unread: unread.get(m.roomId),
        lastMessage: last.get(m.roomId),
        memberCount: m.room._count.members,
      })
    );
  items.sort((a, b) => {
    const ta = a.lastMessage?.createdAt || a.createdAt;
    const tb = b.lastMessage?.createdAt || b.createdAt;
    if (a.type === 'ANNOUNCEMENT' || b.type === 'ANNOUNCEMENT') return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    return new Date(tb) - new Date(ta);
  });
  return { items, totalUnread: items.filter((r) => !r.muted).reduce((s, r) => s + r.unread, 0) };
}

// Menyudagi Chat badge'i uchun yengil so'rov.
async function unreadSummary(user) {
  const members = await prisma.chatMember.findMany({ where: { userId: user.id, leftAt: null }, select: { roomId: true, mutedUntil: true } });
  const unread = await unreadByRoom(user.id, members.map((m) => m.roomId));
  let total = 0;
  const rooms = {};
  for (const m of members) {
    const n = unread.get(m.roomId) || 0;
    if (!n) continue;
    rooms[m.roomId] = n;
    if (!isMuted(m)) total += n;
  }
  return { total, rooms };
}

// GET /rooms/:id — xona + a'zolar (o'qilgan joyi bilan, "Ko'rdi: N" uchun).
async function getRoom(user, roomId) {
  const member = await requireMember(roomId, user.id);
  const members = await prisma.chatMember.findMany({
    where: { roomId, leftAt: null },
    orderBy: { joinedAt: 'asc' },
    select: {
      role: true,
      lastReadAt: true,
      lastReadMessageId: true,
      user: { select: { ...PEER_SELECT, role: true } },
    },
  });
  const peer = member.room.type === 'DIRECT' ? members.find((m) => m.user.id !== user.id)?.user || (await directPeer(roomId, user.id)) : null;
  const [unread, last] = await Promise.all([unreadByRoom(user.id, [roomId]), lastMessages(user.id, [roomId])]);
  return {
    ...roomOut(member, { peer, user, unread: unread.get(roomId), lastMessage: last.get(roomId), memberCount: members.length }),
    members: members.map((m) => ({
      id: m.user.id,
      fullName: m.user.fullName,
      userRole: m.user.role,
      role: m.role,
      active: isChatActive(m.user),
      lastSeenAt: m.user.lastSeenAt,
      lastReadAt: m.lastReadAt,
      lastReadMessageId: m.lastReadMessageId,
    })),
  };
}

// Chatda yozish mumkin bo'lgan faol foydalanuvchilar (shaxsiy xona va
// guruhga qo'shish uchun).
async function directory(user, q) {
  const text = typeof q === 'string' ? q.trim().slice(0, 100) : '';
  const users = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      isActive: true,
      deletedAt: null,
      chatEnabled: true,
      ...(text ? { fullName: { contains: text, mode: 'insensitive' } } : {}),
    },
    orderBy: { fullName: 'asc' },
    take: 500,
    select: {
      id: true,
      fullName: true,
      role: true,
      lastSeenAt: true,
      lab: { select: { nameUz: true } },
      staff: { select: { position: true, laboratory: { select: { nameUz: true } } } },
    },
  });
  return {
    items: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      role: u.role,
      position: u.staff?.position || null,
      laboratoryName: u.lab?.nameUz || u.staff?.laboratory?.nameUz || null,
      lastSeenAt: u.lastSeenAt,
    })),
  };
}

async function activeChatUsers(ids) {
  const unique = [...new Set((ids || []).filter((x) => typeof x === 'string'))];
  if (!unique.length) return [];
  return prisma.user.findMany({
    where: { id: { in: unique }, isActive: true, deletedAt: null, chatEnabled: true },
    select: { id: true, fullName: true },
  });
}

// POST /rooms/direct — ikki kishi orasida bitta xona (directKey).
async function openDirect(user, peerId) {
  if (typeof peerId !== 'string' || peerId === user.id) throw badRequest("Foydalanuvchi noto'g'ri.");
  const [peer] = await activeChatUsers([peerId]);
  if (!peer) throw notFound('Foydalanuvchi topilmadi.');
  const directKey = [user.id, peer.id].sort().join(':');

  let room = await prisma.chatRoom.findUnique({ where: { directKey } });
  if (!room) {
    try {
      room = await prisma.chatRoom.create({
        data: {
          type: 'DIRECT',
          directKey,
          createdById: user.id,
          members: { create: [{ userId: user.id }, { userId: peer.id }] },
        },
      });
    } catch (err) {
      if (err.code !== 'P2002') throw err;
      room = await prisma.chatRoom.findUnique({ where: { directKey } });
    }
  }
  // Ikkala a'zolik ham faol bo'lsin (masalan, hisob qayta faollashgandan keyin).
  await prisma.chatMember.updateMany({ where: { roomId: room.id, leftAt: { not: null } }, data: { leftAt: null } });
  // Ochgan tomonda xona ro'yxatda ko'rinadi (bo'sh bo'lsa ham).
  await prisma.chatMember.updateMany({ where: { roomId: room.id, userId: user.id, lastReadAt: null }, data: { lastReadAt: new Date() } });
  return getRoom(user, room.id);
}

function cleanTitle(title) {
  if (typeof title !== 'string') throw badRequest('Guruh nomini kiriting.');
  const t = title.trim().replace(/\s+/g, ' ');
  if (t.length < 2 || t.length > 100) throw badRequest("Guruh nomi 2–100 belgi bo'lsin.");
  return t;
}

async function canCreateGroups(user) {
  const settings = await getSettings();
  return settings.whoCanCreateGroups === 'ALL' || ANNOUNCERS.includes(user.role);
}

// POST /rooms — guruh; yaratuvchi OWNER.
async function createGroup(user, { title, memberIds } = {}) {
  if (!(await canCreateGroups(user))) throw forbidden('Guruhni faqat rahbariyat yaratadi.');
  const name = cleanTitle(title);
  const others = (await activeChatUsers(memberIds)).filter((u) => u.id !== user.id);
  if (others.length + 1 > MAX_GROUP_MEMBERS) throw badRequest(`Guruhda ko'pi bilan ${MAX_GROUP_MEMBERS} kishi.`);
  const room = await prisma.chatRoom.create({
    data: {
      type: 'GROUP',
      title: name,
      createdById: user.id,
      members: { create: [{ userId: user.id, role: 'OWNER' }, ...others.map((u) => ({ userId: u.id, role: 'MEMBER' }))] },
    },
  });
  await systemMessage(room.id, user.id, `${user.fullName} guruhni yaratdi`, { action: 'group_created' });
  for (const u of [user, ...others]) chatEvents.emit('membership:changed', { userId: u.id });
  return getRoom(user, room.id);
}

async function requireGroupManager(user, roomId) {
  const member = await requireMember(roomId, user.id);
  if (member.room.type !== 'GROUP') throw forbidden('Bu amal faqat guruhlar uchun.');
  if (!['OWNER', 'ADMIN'].includes(member.role)) throw forbidden('Faqat guruh egasi yoki administratori.');
  if (member.room.isArchived) throw forbidden('Guruh arxivlangan.');
  return member;
}

async function renameGroup(user, roomId, { title } = {}) {
  const member = await requireGroupManager(user, roomId);
  const name = cleanTitle(title);
  if (name === member.room.title) return getRoom(user, roomId);
  await prisma.chatRoom.update({ where: { id: roomId }, data: { title: name } });
  await systemMessage(roomId, user.id, `${user.fullName} guruh nomini o'zgartirdi: ${name}`, { action: 'renamed' });
  chatEvents.emit('room:updated', { roomId });
  return getRoom(user, roomId);
}

async function addMembers(user, roomId, { userIds } = {}) {
  await requireGroupManager(user, roomId);
  const users = await activeChatUsers(userIds);
  if (!users.length) throw badRequest('Qo\'shiladigan foydalanuvchini tanlang.');
  const current = await prisma.chatMember.count({ where: { roomId, leftAt: null } });
  if (current + users.length > MAX_GROUP_MEMBERS) throw badRequest(`Guruhda ko'pi bilan ${MAX_GROUP_MEMBERS} kishi.`);
  const added = [];
  for (const u of users) {
    const existing = await prisma.chatMember.findUnique({ where: { roomId_userId: { roomId, userId: u.id } } });
    if (existing && !existing.leftAt) continue;
    await prisma.chatMember.upsert({
      where: { roomId_userId: { roomId, userId: u.id } },
      create: { roomId, userId: u.id, role: 'MEMBER' },
      update: { leftAt: null, role: 'MEMBER', joinedAt: new Date(), lastReadAt: null, lastReadMessageId: null, mutedUntil: null },
    });
    added.push(u);
  }
  if (added.length) {
    await systemMessage(roomId, user.id, `${user.fullName} qo'shdi: ${added.map((u) => u.fullName).join(', ')}`, {
      action: 'members_added',
      userIds: added.map((u) => u.id),
    });
    for (const u of added) chatEvents.emit('membership:changed', { userId: u.id });
    chatEvents.emit('room:updated', { roomId });
  }
  return getRoom(user, roomId);
}

async function removeMember(user, roomId, targetId) {
  const me = await requireGroupManager(user, roomId);
  if (targetId === user.id) throw badRequest('O\'zingizni chiqarish uchun "Guruhdan chiqish"dan foydalaning.');
  const target = await prisma.chatMember.findFirst({
    where: { roomId, userId: String(targetId), leftAt: null },
    include: { user: { select: { fullName: true } } },
  });
  if (!target) throw notFound('A\'zo topilmadi.');
  if (target.role === 'OWNER') throw forbidden("Guruh egasini chiqarib bo'lmaydi.");
  if (target.role === 'ADMIN' && me.role !== 'OWNER') throw forbidden('Administratorni faqat guruh egasi chiqaradi.');
  await prisma.chatMember.update({ where: { id: target.id }, data: { leftAt: new Date(), role: 'MEMBER' } });
  await systemMessage(roomId, user.id, `${user.fullName} chiqarib yubordi: ${target.user.fullName}`, {
    action: 'member_removed',
    userIds: [target.userId],
  });
  chatEvents.emit('membership:changed', { userId: target.userId });
  chatEvents.emit('room:updated', { roomId });
  return getRoom(user, roomId);
}

async function setMemberRole(user, roomId, targetId, { role } = {}) {
  const me = await requireGroupManager(user, roomId);
  if (me.role !== 'OWNER') throw forbidden('Rollarni faqat guruh egasi o\'zgartiradi.');
  if (!['ADMIN', 'MEMBER'].includes(role)) throw badRequest("Rol noto'g'ri.");
  const target = await prisma.chatMember.findFirst({ where: { roomId, userId: String(targetId), leftAt: null } });
  if (!target) throw notFound('A\'zo topilmadi.');
  if (target.role === 'OWNER') throw badRequest("Guruh egasining rolini o'zgartirib bo'lmaydi.");
  await prisma.chatMember.update({ where: { id: target.id }, data: { role } });
  chatEvents.emit('room:updated', { roomId });
  return getRoom(user, roomId);
}

// Faqat guruhdan chiqish mumkin. Ega chiqsa, egalik eng eski
// administratorga (bo'lmasa eng eski a'zoga) o'tadi; hech kim qolmasa
// guruh arxivlanadi.
async function leaveRoom(user, roomId) {
  const member = await requireMember(roomId, user.id);
  if (member.room.type !== 'GROUP') throw forbidden("Bu xonadan chiqib bo'lmaydi.");
  await prisma.chatMember.update({ where: { id: member.id }, data: { leftAt: new Date(), role: 'MEMBER' } });
  if (member.role === 'OWNER') {
    const heir =
      (await prisma.chatMember.findFirst({ where: { roomId, leftAt: null, role: 'ADMIN' }, orderBy: { joinedAt: 'asc' } })) ||
      (await prisma.chatMember.findFirst({ where: { roomId, leftAt: null }, orderBy: { joinedAt: 'asc' } }));
    if (heir) await prisma.chatMember.update({ where: { id: heir.id }, data: { role: 'OWNER' } });
    else await prisma.chatRoom.update({ where: { id: roomId }, data: { isArchived: true } });
  }
  await systemMessage(roomId, user.id, `${user.fullName} guruhdan chiqdi`, { action: 'member_left' });
  chatEvents.emit('membership:changed', { userId: user.id });
  chatEvents.emit('room:updated', { roomId });
  return { left: true };
}

async function setArchived(user, roomId, { archived } = {}) {
  const member = await requireMember(roomId, user.id);
  if (member.room.type !== 'GROUP') throw forbidden('Faqat guruhni arxivlash mumkin.');
  if (!['OWNER', 'ADMIN'].includes(member.role)) throw forbidden('Faqat guruh egasi yoki administratori.');
  await prisma.chatRoom.update({ where: { id: roomId }, data: { isArchived: Boolean(archived) } });
  await systemMessage(roomId, user.id, `${user.fullName} guruhni ${archived ? 'arxivladi' : 'arxivdan chiqardi'}`, {
    action: archived ? 'archived' : 'unarchived',
  });
  chatEvents.emit('room:updated', { roomId });
  return getRoom(user, roomId);
}

// Ovozsiz: { minutes: 60 } | { forever: true } | { minutes: 0 } (yoqish).
async function setMute(user, roomId, { minutes, forever } = {}) {
  const member = await requireMember(roomId, user.id);
  let mutedUntil = null;
  if (forever) mutedUntil = FOREVER;
  else if (Number(minutes) > 0) mutedUntil = new Date(Date.now() + Math.min(Number(minutes), 525600) * 60000);
  await prisma.chatMember.update({ where: { id: member.id }, data: { mutedUntil } });
  chatEvents.emit('membership:changed', { userId: user.id });
  return { roomId, mutedUntil, muted: Boolean(mutedUntil) };
}

module.exports = {
  listRooms,
  unreadSummary,
  getRoom,
  directory,
  openDirect,
  createGroup,
  canCreateGroups,
  renameGroup,
  addMembers,
  removeMember,
  setMemberRole,
  leaveRoom,
  setArchived,
  setMute,
};
