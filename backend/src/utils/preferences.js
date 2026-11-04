const { allowedKey } = require('./menuCatalog');

// User.preferences — faqat quyidagi kalitlar; boshqasi rad etiladi.
// Jami JSON 4 KB dan oshmaydi.
const MAX_BYTES = 4096;
const PAGE_SIZES = [15, 50, 100];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Bildirishnoma voqealari (mavjud modullar: Vazifalar, Chat).
// task_assigned va task_due — muhim: "Sayt ichida" o'chirilmaydi.
const NOTIFICATION_EVENTS = [
  'task_assigned',
  'task_status',
  'task_comment',
  'task_due',
  'chat_direct',
  'chat_mention',
  'chat_group',
  'chat_announcement',
];
const MANDATORY_IN_APP = ['task_assigned', 'task_due'];
const CHANNELS = ['inApp', 'browser', 'sound'];

// Notification.type -> voqea kaliti.
const TYPE_TO_EVENT = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS: 'task_status',
  TASK_COMMENT: 'task_comment',
  TASK_DUE_SOON: 'task_due',
  TASK_OVERDUE: 'task_due',
};

const DEFAULTS = {
  density: 'normal',
  landingPage: null,
  favorites: [],
  pageSize: 15,
  quietHours: { enabled: false, from: '22:00', to: '08:00' },
  notifications: Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e, { inApp: true, browser: true, sound: true }])),
};

class PreferenceError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}
const fail = (msg) => {
  throw new PreferenceError(msg);
};
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Saqlangan qiymat + standartlar (eski/buzilgan qiymatlar tushib qoladi).
function normalize(stored = {}) {
  const p = isObj(stored) ? stored : {};
  const notifications = {};
  for (const e of NOTIFICATION_EVENTS) {
    const cur = isObj(p.notifications?.[e]) ? p.notifications[e] : {};
    notifications[e] = Object.fromEntries(CHANNELS.map((c) => [c, typeof cur[c] === 'boolean' ? cur[c] : DEFAULTS.notifications[e][c]]));
    if (MANDATORY_IN_APP.includes(e)) notifications[e].inApp = true;
  }
  const q = isObj(p.quietHours) ? p.quietHours : {};
  return {
    density: p.density === 'compact' ? 'compact' : 'normal',
    landingPage: typeof p.landingPage === 'string' ? p.landingPage : null,
    favorites: Array.isArray(p.favorites) ? p.favorites.filter((x) => typeof x === 'string').slice(0, 6) : [],
    pageSize: PAGE_SIZES.includes(p.pageSize) ? p.pageSize : DEFAULTS.pageSize,
    quietHours: {
      enabled: q.enabled === true,
      from: TIME_RE.test(q.from) ? q.from : DEFAULTS.quietHours.from,
      to: TIME_RE.test(q.to) ? q.to : DEFAULTS.quietHours.to,
    },
    notifications,
  };
}

// Kelgan qisman o'zgarishni tekshiradi va saqlanganiga birlashtiradi.
// Menyu kalitlari foydalanuvchi ROLIGA ruxsat etilgan bo'lishi shart.
function mergePreferences(stored, patch, role) {
  if (!isObj(patch)) fail("Sozlamalar noto'g'ri.");
  const allowed = ['density', 'landingPage', 'favorites', 'pageSize', 'quietHours', 'notifications'];
  const unknown = Object.keys(patch).filter((k) => !allowed.includes(k));
  if (unknown.length) fail(`Noma'lum sozlama: ${unknown[0]}`);
  const next = normalize(stored);

  if ('density' in patch) {
    if (!['normal', 'compact'].includes(patch.density)) fail("Ko'rinish zichligi noto'g'ri.");
    next.density = patch.density;
  }
  if ('landingPage' in patch) {
    if (patch.landingPage !== null && (typeof patch.landingPage !== 'string' || !allowedKey(role, patch.landingPage))) {
      fail("Bu sahifa sizning rolingiz uchun ochiq emas.");
    }
    next.landingPage = patch.landingPage;
  }
  if ('favorites' in patch) {
    const fav = patch.favorites;
    if (!Array.isArray(fav) || fav.length > 6) fail("Sevimlilar ko'pi bilan 6 ta.");
    if (fav.some((k) => typeof k !== 'string' || !allowedKey(role, k))) fail("Sevimlilarda ruxsat etilmagan bo'lim bor.");
    next.favorites = [...new Set(fav)];
  }
  if ('pageSize' in patch) {
    if (!PAGE_SIZES.includes(patch.pageSize)) fail("Qatorlar soni 15, 50 yoki 100 bo'lishi kerak.");
    next.pageSize = patch.pageSize;
  }
  if ('quietHours' in patch) {
    const q = patch.quietHours;
    if (!isObj(q) || Object.keys(q).some((k) => !['enabled', 'from', 'to'].includes(k))) fail("Tinch soatlar noto'g'ri.");
    if ('enabled' in q && typeof q.enabled !== 'boolean') fail("Tinch soatlar noto'g'ri.");
    if (('from' in q && !TIME_RE.test(q.from)) || ('to' in q && !TIME_RE.test(q.to))) fail('Vaqt HH:MM formatida bo\'lsin.');
    next.quietHours = { ...next.quietHours, ...q };
  }
  if ('notifications' in patch) {
    const n = patch.notifications;
    if (!isObj(n)) fail("Bildirishnoma sozlamalari noto'g'ri.");
    for (const [event, val] of Object.entries(n)) {
      if (!NOTIFICATION_EVENTS.includes(event)) fail(`Noma'lum voqea: ${event}`);
      if (!isObj(val) || Object.entries(val).some(([c, v]) => !CHANNELS.includes(c) || typeof v !== 'boolean')) fail("Bildirishnoma sozlamalari noto'g'ri.");
      next.notifications[event] = { ...next.notifications[event], ...val };
      if (MANDATORY_IN_APP.includes(event)) next.notifications[event].inApp = true;
    }
  }
  if (Buffer.byteLength(JSON.stringify(next)) > MAX_BYTES) fail('Sozlamalar hajmi juda katta.');
  return next;
}

// Saqlangan landingPage/favorites rol o'zgargandan keyin yopilgan bo'lishi mumkin.
function forRole(prefs, role) {
  return {
    ...prefs,
    landingPage: prefs.landingPage && allowedKey(role, prefs.landingPage) ? prefs.landingPage : null,
    favorites: prefs.favorites.filter((k) => allowedKey(role, k)),
  };
}

// Sayt ichidagi bildirishnoma yaratilsinmi (muhim voqealar — har doim).
function wantsInApp(stored, type) {
  const event = TYPE_TO_EVENT[type];
  if (!event || MANDATORY_IN_APP.includes(event)) return true;
  return normalize(stored).notifications[event].inApp;
}

module.exports = {
  NOTIFICATION_EVENTS,
  MANDATORY_IN_APP,
  TYPE_TO_EVENT,
  DEFAULTS,
  PreferenceError,
  normalize,
  mergePreferences,
  forRole,
  wantsInApp,
};
