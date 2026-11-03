const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET, CLIENT_URL } = require('../config/env');
const { chatEvents } = require('../services/chat/events');
const { getSettings } = require('../services/chat/settings');
const { isChatActive } = require('../services/chat/membership');
const messages = require('../services/chat/messages');
const { ChatError } = require('../services/chat/errors');

// Chat real vaqt qatlami. Express jarayonining o'zida, xotiradagi adapter
// bilan (bitta konteyner). Har bir hodisa ack bilan javob beradi va
// a'zolikni servis qatlami orqali tekshiradi. Xabar matni loglanmaydi.
//
// Kanallar: "user:<id>" (shaxsiy) va "room:<id>" (xona a'zolari).
const PING_INTERVAL = 25000;
const USER_RECHECK_MS = 60 * 1000;
const EVENT_BURST = { max: 40, windowMs: 5000 };

let io = null;
const online = new Map(); // userId -> ulanishlar soni

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      try {
        out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        /* noto'g'ri cookie e'tiborsiz */
      }
    }
  }
  return out;
}

function verifyAccess(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type === 'refresh' || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

async function loadUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, role: true, isActive: true, deletedAt: true, chatEnabled: true, mustChangePassword: true },
  });
  if (!isChatActive(user) || user.mustChangePassword) return null;
  const settings = await getSettings();
  if (!settings.chatEnabled && user.role !== 'SUPER_ADMIN') return null;
  return user;
}

const authError = (msg = 'UNAUTHORIZED') => Object.assign(new Error(msg), { data: { code: msg } });

// Token muddati tugaganda (yangilanmagan bo'lsa) ulanish uziladi.
function scheduleExpiry(socket, payload) {
  clearTimeout(socket.data.expiryTimer);
  const ms = payload.exp * 1000 - Date.now();
  socket.data.expiryTimer = setTimeout(() => {
    socket.emit('auth:expired');
    socket.disconnect(true);
  }, Math.max(ms, 0) + 2000);
}

async function joinMemberRooms(socket) {
  const memberships = await prisma.chatMember.findMany({ where: { userId: socket.data.user.id, leftAt: null }, select: { roomId: true } });
  const wanted = new Set(memberships.map((m) => `room:${m.roomId}`));
  for (const r of socket.rooms) {
    if (r.startsWith('room:') && !wanted.has(r)) socket.leave(r);
  }
  socket.join([...wanted]);
}

function ackOk(ack, data) {
  if (typeof ack === 'function') ack({ ok: true, ...data });
}

function ackError(ack, err, event) {
  if (!(err instanceof ChatError)) console.error(`[chat] socket ${event} -> ${err.code || err.name || 'Error'}`);
  if (typeof ack === 'function') {
    ack({
      ok: false,
      error: err instanceof ChatError ? err.message : 'Serverda xatolik yuz berdi.',
      code: err instanceof ChatError ? err.code : 'SERVER_ERROR',
      status: err instanceof ChatError ? err.status : 500,
    });
  }
}

function broadcastPresence(userId, isOnline, lastSeenAt) {
  io.emit('presence', { userId, online: isOnline, lastSeenAt: lastSeenAt || null });
}

function attachHandlers(socket) {
  const burst = [];
  // Har hodisadan oldin: tezlik, foydalanuvchi holati (davriy qayta tekshiruv).
  const guard = (event, handler) =>
    socket.on(event, async (payload, ack) => {
      if (typeof payload === 'function') {
        ack = payload;
        payload = {};
      }
      const now = Date.now();
      while (burst.length && now - burst[0] > EVENT_BURST.windowMs) burst.shift();
      if (burst.length >= EVENT_BURST.max) return ackError(ack, new ChatError(429, "Juda tez. Birozdan so'ng urinib ko'ring.", 'RATE_LIMIT'), event);
      burst.push(now);
      try {
        if (now - socket.data.checkedAt > USER_RECHECK_MS) {
          const fresh = await loadUser(socket.data.user.id);
          if (!fresh) {
            socket.emit('user:forced-logout');
            socket.disconnect(true);
            return undefined;
          }
          socket.data.user = { id: fresh.id, role: fresh.role, fullName: fresh.fullName };
          socket.data.checkedAt = now;
        }
        const data = await handler(payload && typeof payload === 'object' ? payload : {});
        return ackOk(ack, data);
      } catch (err) {
        return ackError(ack, err, event);
      }
    });

  const me = () => socket.data.user;

  guard('message:send', async (p) => messages.sendMessage(me(), p.roomId, p));
  guard('message:edit', async (p) => ({ message: await messages.editMessage(me(), p.messageId, p) }));
  guard('message:delete', async (p) => messages.deleteMessage(me(), p.messageId, p.scope));
  guard('reaction:toggle', async (p) => messages.toggleReaction(me(), p.messageId, p.emoji));
  guard('room:read', async (p) => messages.markRead(me(), p.roomId, p.messageId));
  guard('presence:ping', async () => ({ online: [...online.keys()] }));

  // Yozmoqda: faqat a'zo bo'lgan xonaga (socket shu kanalda bo'lishi shart).
  let lastTyping = 0;
  guard('typing', async (p) => {
    const channel = `room:${p.roomId}`;
    if (typeof p.roomId !== 'string' || !socket.rooms.has(channel)) throw new ChatError(404, 'Xona topilmadi.', 'NOT_FOUND');
    const now = Date.now();
    if (p.typing !== false && now - lastTyping < 1500) return {};
    lastTyping = now;
    socket.to(channel).emit('typing', { roomId: p.roomId, userId: me().id, fullName: me().fullName, typing: p.typing !== false });
    return {};
  });

  // Token yangilandi (klient axios orqali refresh qilgan).
  socket.on('auth:refresh', (payload, ack) => {
    const data = verifyAccess(payload?.token);
    if (!data || data.sub !== me().id) {
      if (typeof ack === 'function') ack({ ok: false, code: 'UNAUTHORIZED' });
      return;
    }
    scheduleExpiry(socket, data);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('disconnect', async () => {
    clearTimeout(socket.data.expiryTimer);
    const id = me().id;
    const n = (online.get(id) || 1) - 1;
    if (n > 0) {
      online.set(id, n);
      return;
    }
    online.delete(id);
    const lastSeenAt = new Date();
    await prisma.user.update({ where: { id }, data: { lastSeenAt } }).catch(() => {});
    broadcastPresence(id, false, lastSeenAt);
  });
}

// Servis hodisalarini kanallarga tarqatish.
function wireEvents() {
  chatEvents.on('message:new', ({ roomId, message }) => io.to(`room:${roomId}`).emit('message:new', message));
  chatEvents.on('message:updated', ({ roomId, message }) => io.to(`room:${roomId}`).emit('message:updated', message));
  chatEvents.on('message:deleted', ({ roomId, messageId, forUserId }) => {
    const target = forUserId ? io.to(`user:${forUserId}`) : io.to(`room:${roomId}`);
    target.emit('message:deleted', { roomId, messageId, forMe: Boolean(forUserId) });
  });
  chatEvents.on('reaction:updated', (data) => io.to(`room:${data.roomId}`).emit('reaction:updated', data));
  chatEvents.on('room:updated', (data) => io.to(`room:${data.roomId}`).emit('room:updated', data));
  chatEvents.on('room:read-by', (data) => io.to(`room:${data.roomId}`).emit('room:read-by', data));
  // Xonalar ro'yxati o'zgardi: kanallarga qayta qo'shilish + klientga xabar.
  chatEvents.on('membership:changed', async ({ userId }) => {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    for (const s of sockets) {
      const real = io.sockets.sockets.get(s.id);
      if (real) await joinMemberRooms(real).catch(() => {});
    }
    io.to(`user:${userId}`).emit('room:updated', { roomId: null, rooms: true });
  });
  // Nofaol / chat o'chirilgan: darhol uziladi.
  chatEvents.on('user:disabled', ({ userId }) => {
    io.to(`user:${userId}`).emit('user:forced-logout');
    io.in(`user:${userId}`).disconnectSockets(true);
  });
}

function initChatSocket(httpServer) {
  io = new Server(httpServer, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    pingInterval: PING_INTERVAL,
    pingTimeout: 20000,
    maxHttpBufferSize: 64 * 1024,
    cors: { origin: CLIENT_URL, credentials: true },
    serveClient: false,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || parseCookies(socket.handshake.headers.cookie).accessToken;
      const payload = verifyAccess(token);
      if (!payload) return next(authError('UNAUTHORIZED'));
      const user = await loadUser(payload.sub);
      if (!user) return next(authError('CHAT_DISABLED'));
      socket.data.user = { id: user.id, role: user.role, fullName: user.fullName };
      socket.data.checkedAt = Date.now();
      scheduleExpiry(socket, payload);
      return next();
    } catch (err) {
      console.error(`[chat] socket auth -> ${err.code || err.name}`);
      return next(authError('SERVER_ERROR'));
    }
  });

  io.on('connection', async (socket) => {
    const { id } = socket.data.user;
    socket.join(`user:${id}`);
    attachHandlers(socket);
    try {
      await joinMemberRooms(socket);
    } catch (err) {
      console.error(`[chat] socket join -> ${err.code || err.name}`);
    }
    const n = (online.get(id) || 0) + 1;
    online.set(id, n);
    if (n === 1) broadcastPresence(id, true);
    socket.emit('presence', { online: [...online.keys()] });
    socket.emit('ready', { userId: id });
  });

  wireEvents();
  return io;
}

module.exports = { initChatSocket };
