import { io } from 'socket.io-client';
import apiClient, { getAccessToken, onAccessToken, setAccessToken } from '../api/client';
import chatApi from './chatApi';
import { alertFor } from '../utils/notifyPrefs';

// Chatning global holati: bitta Socket.IO ulanishi, o'qilmaganlar soni,
// onlayn foydalanuvchilar, yuborilmagan xabarlar navbati (offline queue),
// media havolalari keshi, ovoz va brauzer bildirishnomalari.
// Bu modul faqat dinamik import qilinadi (asosiy bundle'ga tushmaydi).

const listeners = new Map();
export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}
function fire(event, data) {
  listeners.get(event)?.forEach((fn) => {
    try {
      fn(data);
    } catch (err) {
      console.error(err);
    }
  });
}

const state = {
  me: null,
  status: 'idle', // idle | connecting | online | offline | disabled
  unread: { total: 0, rooms: {} },
  online: new Set(),
  activeRoomId: null,
};
export const getState = () => state;

let socket = null;
let offToken = null;
let refreshing = null;

// ---------------- ulanish ----------------
async function refreshToken() {
  if (!refreshing) {
    refreshing = apiClient
      .post('/auth/refresh')
      .then((r) => {
        // setAccessToken kuzatuvchisi socketni qayta ulaydi.
        setAccessToken(r.data.accessToken);
        return r.data.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

function setStatus(status) {
  state.status = status;
  fire('status', status);
}

export function start(me) {
  if (socket) {
    state.me = me;
    return;
  }
  state.me = me;
  loadRoomMeta();
  setStatus('connecting');
  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    // Har (qayta) ulanishda eng so'nggi access token olinadi.
    auth: (cb) => cb(getAccessToken() ? { token: getAccessToken() } : {}),
  });

  socket.on('connect', () => {
    setStatus('online');
    flushOutbox();
    refreshUnread();
    fire('reconnected');
  });
  socket.on('disconnect', () => {
    if (state.status !== 'disabled') setStatus('offline');
  });
  socket.on('connect_error', async (err) => {
    if (err.message === 'CHAT_DISABLED') {
      setStatus('disabled');
      socket.disconnect();
      return;
    }
    if (err.message === 'UNAUTHORIZED') {
      setStatus('offline');
      try {
        await refreshToken();
        socket.connect();
      } catch {
        // sessiya tugagan — keyingi API so'rov login sahifasiga olib boradi
      }
    }
  });
  socket.on('auth:expired', () => {
    refreshToken()
      .then(() => socket.connect())
      .catch(() => {});
  });
  socket.on('user:forced-logout', () => {
    setStatus('disabled');
    fire('forced-logout');
  });

  socket.on('presence', (d) => {
    if (Array.isArray(d.online)) state.online = new Set(d.online);
    else if (d.online) state.online.add(d.userId);
    else state.online.delete(d.userId);
    fire('presence', d);
  });
  socket.on('message:new', (m) => onIncoming(m));
  ['message:updated', 'message:deleted', 'reaction:updated', 'typing', 'room:read-by'].forEach((ev) =>
    socket.on(ev, (d) => fire(ev, d))
  );
  socket.on('room:updated', (d) => {
    fire('room:updated', d);
    if (d.rooms) loadRoomMeta();
    if (d.rooms) refreshUnread();
  });

  // Axios token yangilasa — ochiq socket ham yangi tokenni oladi.
  offToken = onAccessToken((token) => {
    if (!socket) return;
    if (token && socket.connected) socket.emit('auth:refresh', { token });
    else if (token && !socket.connected && state.status !== 'disabled') socket.connect();
  });
}

export function stop() {
  offToken?.();
  socket?.disconnect();
  socket = null;
  setStatus('idle');
}

export const isConnected = () => Boolean(socket?.connected);

function emitAck(event, payload, timeout = 10000) {
  return new Promise((resolve) => {
    if (!socket?.connected) return resolve({ ok: false, offline: true });
    socket.timeout(timeout).emit(event, payload, (err, res) => resolve(err ? { ok: false, offline: true } : res));
    return undefined;
  });
}

// Hodisa socket orqali; ulanish bo'lmasa REST zaxira yo'li.
async function call(event, payload, rest) {
  const res = await emitAck(event, payload);
  if (res.ok) return res;
  if (!res.offline) throw Object.assign(new Error(res.error), res);
  try {
    return { ok: true, ...(await rest()) };
  } catch (err) {
    throw Object.assign(new Error(err?.response?.data?.error || 'Xatolik'), {
      error: err?.response?.data?.error || "Ulanish yo'q. Keyinroq urinib ko'ring.",
      status: err?.response?.status,
      offline: !err?.response,
    });
  }
}

export const editMessage = (messageId, body) =>
  call('message:edit', { messageId, body }, async () => ({ message: await chatApi.edit(messageId, body) }));
export const deleteMessage = (messageId, scope) =>
  call('message:delete', { messageId, scope }, () => chatApi.remove(messageId, scope));
export const toggleReaction = (messageId, emoji) =>
  call('reaction:toggle', { messageId, emoji }, () => chatApi.react(messageId, emoji));

const lastRead = new Map();
export function markRead(roomId, messageId) {
  if (!roomId || !messageId || lastRead.get(roomId) === messageId) return;
  lastRead.set(roomId, messageId);
  call('room:read', { roomId, messageId }, () => chatApi.read(roomId, messageId))
    .then(() => {
      if (state.unread.rooms[roomId]) {
        state.unread.rooms = { ...state.unread.rooms, [roomId]: 0 };
        refreshUnread();
      }
    })
    .catch(() => lastRead.delete(roomId));
}

let typingAt = 0;
export function sendTyping(roomId, typing = true) {
  if (!socket?.connected) return;
  const now = Date.now();
  if (typing && now - typingAt < 2500) return;
  typingAt = typing ? now : 0;
  socket.emit('typing', { roomId, typing }, () => {});
}

// ---------------- o'qilmaganlar ----------------
let unreadTimer = null;
export function refreshUnread() {
  clearTimeout(unreadTimer);
  unreadTimer = setTimeout(() => {
    chatApi
      .unread()
      .then((u) => {
        state.unread = u;
        fire('unread', u);
      })
      .catch(() => {});
  }, 300);
}

export function setActiveRoom(roomId) {
  state.activeRoomId = roomId;
}

function onIncoming(m) {
  const mine = m.senderId === state.me?.id;
  if (mine) resolveOutbox(m.clientId, m);
  fire('message:new', m);
  if (mine || m.type === 'SYSTEM') return;
  const viewing = state.activeRoomId === m.roomId && document.visibilityState === 'visible';
  if (!viewing) {
    refreshUnread();
    notify(m);
  }
}

// ---------------- ovoz va bildirishnoma ----------------
// Sozlamalar profildagi "Bildirishnomalar" yorlig'ida (voqea bo'yicha
// brauzer/ovoz, tinch soatlar) — utils/notifyPrefs.js qo'llaydi.
const mutedRooms = new Set();
const roomTypes = new Map();
export function setMutedRooms(ids) {
  mutedRooms.clear();
  ids.forEach((id) => mutedRooms.add(id));
}
// Xonalar ro'yxatidan: ovozsizlar va xona turlari (voqea turini aniqlash uchun).
export function setRoomMeta(rooms) {
  setMutedRooms(rooms.filter((r) => r.muted).map((r) => r.id));
  rooms.forEach((r) => roomTypes.set(r.id, r.type));
}
let metaTimer = null;
function loadRoomMeta() {
  clearTimeout(metaTimer);
  metaTimer = setTimeout(() => {
    chatApi
      .rooms()
      .then((r) => setRoomMeta(r.items))
      .catch(() => {});
  }, 500);
}

export const previewText = (m) => {
  if (m.deletedAt) return "Xabar o'chirildi";
  const labels = { IMAGE: '🖼 Rasm', VIDEO: '🎬 Video', VIDEO_NOTE: '⏺ Video xabar', VOICE: '🎤 Ovozli xabar', FILE: '📎 Fayl', STICKER: '🙂 Stiker' };
  if (m.type === 'TEXT' || m.type === 'SYSTEM') return m.body || m.preview || '';
  return m.body || m.preview ? `${labels[m.type]}: ${m.body || m.preview}` : labels[m.type] || '';
};

function chatEvent(m) {
  if (m.meta?.mentions?.includes(state.me?.id)) return 'chat_mention';
  const type = roomTypes.get(m.roomId);
  if (type === 'DIRECT') return 'chat_direct';
  if (type === 'ANNOUNCEMENT') return 'chat_announcement';
  return 'chat_group';
}

function notify(m) {
  if (mutedRooms.has(m.roomId)) return;
  if (!roomTypes.has(m.roomId)) loadRoomMeta();
  alertFor(chatEvent(m), {
    title: m.sender?.fullName || 'Yangi xabar',
    body: previewText(m),
    tag: m.roomId,
    onClick: () => {
      if (listeners.get('open-room')?.size) fire('open-room', m.roomId);
      else window.location.assign(`/admin/chat?room=${m.roomId}`);
    },
  });
}

// ---------------- yuborish navbati (offline queue) ----------------
// Har bir xabar o'z clientId'si bilan saqlanadi; server (senderId, clientId)
// bo'yicha dublikatni rad etadi, shuning uchun qayta yuborish xavfsiz.
const outbox = new Map();
const outboxKey = () => `slm-chat-outbox:${state.me?.id}`;
function persistOutbox() {
  try {
    const textOnly = [...outbox.values()].filter((i) => i.payload.type === 'TEXT' || i.payload.type === 'STICKER');
    localStorage.setItem(outboxKey(), JSON.stringify(textOnly.map(({ payload, createdAt, error, status }) => ({ payload, createdAt, error, status }))));
  } catch {
    /* saqlanmasa ham ishlaydi */
  }
}
export function loadOutbox() {
  try {
    const saved = JSON.parse(localStorage.getItem(outboxKey()) || '[]');
    saved.forEach((i) => outbox.has(i.payload.clientId) || outbox.set(i.payload.clientId, { ...i, status: i.status === 'failed' ? 'failed' : 'pending' }));
  } catch {
    /* bo'sh */
  }
}
export const outboxFor = (roomId) => [...outbox.values()].filter((i) => i.payload.roomId === roomId);

function resolveOutbox(clientId, message) {
  if (!outbox.has(clientId)) return;
  outbox.delete(clientId);
  persistOutbox();
  fire('outbox', { clientId, message });
}

async function trySend(item) {
  item.status = 'pending';
  fire('outbox', { clientId: item.payload.clientId });
  const { roomId } = item.payload;
  let res = await emitAck('message:send', item.payload);
  if (res.offline) {
    try {
      res = { ok: true, ...(await chatApi.send(roomId, item.payload)) };
    } catch (err) {
      res = err?.response ? { ok: false, error: err.response.data?.error, status: err.response.status } : { ok: false, offline: true };
    }
  }
  if (res.ok) {
    resolveOutbox(item.payload.clientId, res.message);
    return res.message;
  }
  if (!res.offline) {
    item.status = 'failed';
    item.error = res.error || 'Yuborilmadi';
  }
  persistOutbox();
  fire('outbox', { clientId: item.payload.clientId });
  return null;
}

export function sendMessage(payload) {
  const item = { payload, createdAt: new Date().toISOString(), status: 'pending', error: null };
  outbox.set(payload.clientId, item);
  persistOutbox();
  fire('outbox', { clientId: payload.clientId });
  return trySend(item);
}

export function retryMessage(clientId) {
  const item = outbox.get(clientId);
  if (item) trySend(item);
}

export function discardMessage(clientId) {
  outbox.delete(clientId);
  persistOutbox();
  fire('outbox', { clientId });
}

let flushing = false;
async function flushOutbox() {
  if (flushing) return;
  flushing = true;
  try {
    for (const item of [...outbox.values()]) {
      if (item.status === 'pending') await trySend(item);
    }
  } finally {
    flushing = false;
  }
}
window.addEventListener('online', () => flushOutbox());

export const newClientId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');

// ---------------- media havolalari keshi ----------------
const urlCache = new Map(); // attachmentId -> { url, thumbUrl, exp }
const expOf = (url) => Number(/[?&]e=(\d+)/.exec(url || '')?.[1] || 0) * 1000;
let pendingIds = new Set();
let pendingWaiters = [];
let batchTimer = null;

export function rememberUrls(attachments) {
  (attachments || []).forEach((a) => {
    if (a.url) urlCache.set(a.id, { url: a.url, thumbUrl: a.thumbUrl, exp: expOf(a.url) });
  });
}

function fresh(id) {
  const c = urlCache.get(id);
  return c && c.exp - Date.now() > 60 * 1000 ? c : null;
}

export function mediaUrl(att) {
  if (!att || att.expired) return Promise.resolve(null);
  if (att.url && expOf(att.url) - Date.now() > 60 * 1000) {
    rememberUrls([att]);
    return Promise.resolve({ url: att.url, thumbUrl: att.thumbUrl });
  }
  const c = fresh(att.id);
  if (c) return Promise.resolve(c);
  return new Promise((resolve) => {
    pendingIds.add(att.id);
    pendingWaiters.push({ id: att.id, resolve });
    clearTimeout(batchTimer);
    batchTimer = setTimeout(runBatch, 30);
  });
}

async function runBatch() {
  const ids = [...pendingIds];
  const waiters = pendingWaiters;
  pendingIds = new Set();
  pendingWaiters = [];
  let items = {};
  try {
    items = (await chatApi.mediaUrls(ids)).items || {};
  } catch {
    items = {};
  }
  Object.entries(items).forEach(([id, v]) => urlCache.set(id, { ...v, exp: expOf(v.url) }));
  waiters.forEach((w) => w.resolve(items[w.id] ? urlCache.get(w.id) : null));
}

// Bitta audio/video bir vaqtda o'ynaydi.
let currentPlayer = null;
export function claimPlayback(el) {
  if (currentPlayer && currentPlayer !== el) {
    try {
      currentPlayer.pause();
    } catch {
      /* allaqachon to'xtagan */
    }
  }
  currentPlayer = el;
}
