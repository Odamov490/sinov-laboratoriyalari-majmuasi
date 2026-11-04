const fs = require('fs');
const path = require('path');
const argon2 = require('argon2');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyFileSignature, absoluteUploadDir } = require('../middleware/upload');
const { passwordSchema, effectiveLabId } = require('../utils/accounts');
const { normalize, mergePreferences, forRole, NOTIFICATION_EVENTS, MANDATORY_IN_APP, PreferenceError } = require('../utils/preferences');
const { menuForRole } = require('../utils/menuCatalog');
const { signAccessToken, cookieOptions } = require('../utils/tokens');
const sessions = require('../services/sessions');
const { tashkentToday, dateOnly, tashkentDayStart, notifyUsers } = require('../services/inAppNotifications');

// /admin/profile — shaxsiy kabinet. Har doim faqat req.user.sub: boshqa
// foydalanuvchi ID'si hech qayerda qabul qilinmaydi. F.I.Sh., login, rol va
// laboratoriya bu yerda O'ZGARTIRILMAYDI (faqat telefon, Telegram, rasm,
// sozlamalar va parol).
const me = (req) => req.user.sub;

const PROFILE_INCLUDE = {
  lab: { select: { id: true, nameUz: true } },
  staff: { select: { id: true, position: true, laboratoryId: true, isActive: true, deletedAt: true, laboratory: { select: { nameUz: true } } } },
};

async function loadUser(req) {
  const user = await prisma.user.findUnique({ where: { id: me(req) }, include: PROFILE_INCLUDE });
  if (!user) throw Object.assign(new Error('Hisob topilmadi.'), { status: 404 });
  return user;
}

function completeness(user) {
  const checks = [
    ['avatar', 'Profil rasmi', Boolean(user.avatarUrl)],
    ['phone', 'Telefon raqami', Boolean(user.phone)],
    ['telegram', 'Telegram', Boolean(user.telegram)],
  ];
  const done = checks.filter((c) => c[2]).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[2]).map(([key, label]) => ({ key, label })) };
}

function profileOut(user) {
  const prefs = forRole(normalize(user.preferences), user.role);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    labId: effectiveLabId(user),
    labName: user.lab?.nameUz || user.staff?.laboratory?.nameUz || null,
    position: user.staff?.position || null,
    // Ommaviy "Mutaxassislar" sahifasida ko'rinadigan karta (faol bo'lsa).
    staffCard: user.staff && user.staff.isActive && !user.staff.deletedAt ? { id: user.staff.id, publicUrl: '/mutaxassislar' } : null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    passwordChangedAt: user.passwordChangedAt,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    telegram: user.telegram,
    preferences: prefs,
    completeness: completeness(user),
    menuOptions: menuForRole(user.role),
    notificationEvents: NOTIFICATION_EVENTS,
    mandatoryInApp: MANDATORY_IN_APP,
    // Vazifalar moduli bor: ma'lumotni tuzatish so'rovi shu orqali.
    canRequestCorrection: true,
  };
}

const getProfile = asyncHandler(async (req, res) => {
  res.json(profileOut(await loadUser(req)));
});

// "+998 90 123-45-67", "901234567", "998901234567" -> "+998901234567".
function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  if (!/^\d{9}$/.test(local)) return null;
  return `+998${local}`;
}

const updateSchema = z
  .object({
    phone: z.string().max(30).nullable().optional(),
    telegram: z.string().max(40).nullable().optional(),
    preferences: z.record(z.any()).optional(),
  })
  .strip(); // fullName, email, role, labId... jim e'tiborsiz qoldiriladi

const updateProfile = asyncHandler(async (req, res) => {
  const body = updateSchema.parse(req.body || {});
  const user = await loadUser(req);
  const data = {};
  if (body.phone !== undefined) {
    if (body.phone === null || body.phone.trim() === '') data.phone = null;
    else {
      const phone = normalizePhone(body.phone);
      if (!phone) return res.status(400).json({ error: "Telefon raqami noto'g'ri. Masalan: +998 90 123 45 67" });
      data.phone = phone;
    }
  }
  if (body.telegram !== undefined) {
    if (body.telegram === null || body.telegram.trim() === '') data.telegram = null;
    else {
      const name = body.telegram.trim().replace(/^(https?:\/\/)?t\.me\//i, '').replace(/^@/, '');
      if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(name) || name.endsWith('_')) {
        return res.status(400).json({ error: "Telegram nomi noto'g'ri: @ bilan, 5–32 belgi (lotin harf, raqam, _)." });
      }
      data.telegram = `@${name}`;
    }
  }
  if (body.preferences !== undefined) {
    try {
      data.preferences = mergePreferences(user.preferences, body.preferences, user.role);
    } catch (err) {
      if (err instanceof PreferenceError) return res.status(400).json({ error: err.message });
      throw err;
    }
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data, include: PROFILE_INCLUDE });
  return res.json(profileOut(updated));
});

// ---------------- rasm ----------------
const AVATAR_MAX = 2 * 1024 * 1024;
const AVATAR_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function removeUploaded(url) {
  const m = /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(url || '');
  if (m) fs.promises.unlink(path.join(absoluteUploadDir, m[1])).catch(() => {});
}

function isWebp(file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  return buf.slice(8, 12).toString('latin1') === 'WEBP';
}

const uploadAvatar = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Rasm tanlanmagan.' });
  const ext = path.extname(file.filename).toLowerCase();
  const reject = (msg) => {
    fs.promises.unlink(file.path).catch(() => {});
    return res.status(400).json({ error: msg });
  };
  if (!AVATAR_EXT.includes(ext)) return reject('Faqat JPG, PNG yoki WEBP rasm.');
  if (file.size > AVATAR_MAX) return reject("Rasm hajmi 2 MB dan oshmasin.");
  if (!verifyFileSignature(file.path) || (ext === '.webp' && !isWebp(file.path))) return reject("Fayl rasm emas yoki kengaytmasi o'zgartirilgan.");

  const user = await loadUser(req);
  const avatarUrl = `/uploads/${file.filename}`;
  const updated = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl }, include: PROFILE_INCLUDE });
  removeUploaded(user.avatarUrl);
  return res.json(profileOut(updated));
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await loadUser(req);
  const updated = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null }, include: PROFILE_INCLUDE });
  removeUploaded(user.avatarUrl);
  res.json(profileOut(updated));
});

// ---------------- parol ----------------
const passwordBody = z.object({
  currentPassword: z.string().min(1, 'Joriy parolni kiriting.').max(200),
  newPassword: passwordSchema,
  signOutOthers: z.boolean().optional().default(true),
});

// mustChangePassword holatida ham ochiq (requireActiveAccount istisnosi).
const changePassword = asyncHandler(async (req, res) => {
  const parsed = passwordBody.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { currentPassword, newPassword, signOutOthers } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: me(req) } });
  const valid = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
  if (!valid) return res.status(400).json({ error: "Joriy parol noto'g'ri." });
  if (newPassword === currentPassword) return res.status(400).json({ error: 'Yangi parol joriy paroldan farq qilishi kerak.' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await argon2.hash(newPassword), mustChangePassword: false, failedLoginCount: 0, lockedUntil: null, passwordChangedAt: new Date() },
  });
  const sid = req.user.sid || null;
  let signedOut = 0;
  if (signOutOthers) signedOut = (await sessions.revokeOtherSessions(user.id, sid)).count;
  // Rol/ism o'zgarmagan, lekin mustChangePassword tushdi — yangi access token.
  const accessToken = signAccessToken(updated, sid);
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  return res.json({ ok: true, accessToken, signedOutOthers: signedOut, passwordChangedAt: updated.passwordChangedAt });
});

// ---------------- qurilmalar va kirishlar ----------------
const listSessions = asyncHandler(async (req, res) => {
  const rows = await prisma.userSession.findMany({
    where: { userId: me(req), revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: 'desc' },
  });
  res.json({
    items: rows.map((s) => ({
      id: s.id,
      device: sessions.deviceName(s.userAgent),
      ip: sessions.maskIp(s.ip),
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      current: s.id === req.user.sid,
    })),
    accessTokenMinutes: 15,
  });
});

const revokeSession = asyncHandler(async (req, res) => {
  const { count } = await sessions.revokeSession(String(req.params.id), me(req));
  if (!count) return res.status(404).json({ error: 'Qurilma topilmadi.' });
  res.json({ ok: true, current: req.params.id === req.user.sid });
});

const revokeOthers = asyncHandler(async (req, res) => {
  const { count } = await sessions.revokeOtherSessions(me(req), req.user.sid || null);
  res.json({ ok: true, revoked: count });
});

const listLogins = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [items, failedCount] = await Promise.all([
    prisma.loginEvent.findMany({ where: { userId: me(req), success: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.loginEvent.count({ where: { userId: me(req), success: false, createdAt: { gte: since } } }),
  ]);
  res.json({
    items: items.map((e) => ({ id: e.id, at: e.createdAt, device: sessions.deviceName(e.userAgent), ip: sessions.maskIp(e.ip) })),
    failedLast30Days: failedCount,
  });
});

// ---------------- xulosa ----------------
const OPEN = ['YANGI', 'JARAYONDA', 'TEKSHIRUVDA'];
function monthStart() {
  const ymd = tashkentToday();
  return new Date(dateOnly(`${ymd.slice(0, 8)}01`).getTime() - 5 * 60 * 60 * 1000);
}

const summary = asyncHandler(async (req, res) => {
  const userId = me(req);
  const mine = { deletedAt: null, OR: [{ assignees: { some: { userId } } }, { creatorId: userId, assignees: { none: {} } }] };
  const [openTasks, overdueTasks, doneThisMonth, unreadNotifications] = await Promise.all([
    prisma.task.count({ where: { ...mine, status: { in: OPEN } } }),
    prisma.task.count({ where: { ...mine, status: { in: OPEN }, dueDate: { lt: dateOnly(tashkentToday()) } } }),
    prisma.task.count({ where: { ...mine, status: 'BAJARILDI', completedAt: { gte: monthStart() } } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  res.json({ tasks: { open: openTasks, overdue: overdueTasks, doneThisMonth }, notifications: { unread: unreadNotifications } });
});

// ---------------- faoliyatim ----------------
// Manbalar (yangi audit jadvalisiz): TaskActivity (o'zim), SampleMovement
// (performedByUserId = o'zim), TestJournalChange (userId = o'zim),
// LoginEvent (muvaffaqiyatli kirishlarim).
const TASK_ACTION = {
  CREATED: 'Vazifa yaratdi',
  UPDATED: 'Vazifani tahrirladi',
  ASSIGNED: "Ijrochilarni o'zgartirdi",
  STATUS: "Holatni o'zgartirdi",
  CHECKLIST: "Nazorat ro'yxatini yangiladi",
  COMMENT: 'Izoh yozdi',
  ATTACHMENT: 'Fayl biriktirdi',
  DELETED: "Vazifani o'chirdi",
};
const SAMPLE_ACTION = { REGISTRATSIYA: "Namunani ro'yxatga oldi", CHIQARISH: 'Namunani chiqardi', QABUL_QILISH: 'Namunani qabul qildi', YAKUNLASH: 'Namunani yakunladi' };
const JOURNAL_ACTION = { CREATE: "Jurnalga yozuv qo'shdi", UPDATE: 'Jurnal yozuvini tahrirladi', DELETE: "Jurnal yozuvini o'chirdi" };
const TASK_STATUS_LABEL = { YANGI: 'Yangi', JARAYONDA: 'Jarayonda', TEKSHIRUVDA: 'Tekshiruvda', BAJARILDI: 'Bajarildi', BEKOR_QILINDI: 'Bekor qilindi' };
const ACTIVITY_TYPES = ['task', 'sample', 'journal', 'login'];

const activity = asyncHandler(async (req, res) => {
  const userId = me(req);
  const type = ACTIVITY_TYPES.includes(req.query.type) ? req.query.type : null;
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const before = req.query.before && !Number.isNaN(Date.parse(req.query.before)) ? new Date(req.query.before) : null;
  const at = before ? { lt: before } : undefined;
  const want = (t) => !type || type === t;

  const [tasks, samples, journal, logins] = await Promise.all([
    want('task')
      ? prisma.taskActivity.findMany({
          where: { userId, ...(at && { createdAt: at }) },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { task: { select: { id: true, title: true, deletedAt: true } } },
        })
      : [],
    want('sample')
      ? prisma.sampleMovement.findMany({
          where: { performedByUserId: userId, ...(at && { createdAt: at }) },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { sample: { select: { id: true, code: true } } },
        })
      : [],
    want('journal')
      ? prisma.testJournalChange.findMany({ where: { userId, ...(at && { createdAt: at }) }, orderBy: { createdAt: 'desc' }, take: limit })
      : [],
    want('login') ? prisma.loginEvent.findMany({ where: { userId, success: true, ...(at && { createdAt: at }) }, orderBy: { createdAt: 'desc' }, take: limit }) : [],
  ]);

  const items = [
    ...tasks.map((a) => ({
      id: `t-${a.id}`,
      type: 'task',
      at: a.createdAt,
      text: a.action === 'STATUS' && a.meta?.to ? `Holatni o'zgartirdi: ${TASK_STATUS_LABEL[a.meta.to] || a.meta.to}` : TASK_ACTION[a.action] || a.action,
      subject: a.task?.title || null,
      link: a.task && !a.task.deletedAt ? `/admin/vazifalar?task=${a.task.id}` : null,
    })),
    ...samples.map((m) => ({
      id: `s-${m.id}`,
      type: 'sample',
      at: m.createdAt,
      text: SAMPLE_ACTION[m.action] || m.action,
      subject: m.sample?.code || null,
      link: m.sample ? `/admin/namunalar/${m.sample.id}` : null,
    })),
    ...journal.map((j) => ({ id: `j-${j.id}`, type: 'journal', at: j.createdAt, text: JOURNAL_ACTION[j.action] || j.action, subject: null, link: null })),
    ...logins.map((l) => ({ id: `l-${l.id}`, type: 'login', at: l.createdAt, text: 'Tizimga kirdi', subject: sessions.deviceName(l.userAgent), link: null })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);

  // Shu oy xulosasi (faqat birinchi sahifada).
  let month = null;
  if (!before) {
    const from = monthStart();
    const [doneTasks, sampleMoves] = await Promise.all([
      prisma.taskActivity.count({ where: { userId, action: 'STATUS', createdAt: { gte: from }, meta: { path: ['to'], equals: 'BAJARILDI' } } }),
      prisma.sampleMovement.count({ where: { performedByUserId: userId, createdAt: { gte: from } } }),
    ]);
    month = { doneTasks, sampleMoves };
  }
  res.json({ items, hasMore: items.length === limit, nextBefore: items.length ? items[items.length - 1].at : null, month, types: ACTIVITY_TYPES });
});

// ---------------- tuzatish so'rovi ----------------
const CORRECTION_PREFIX = "Profil ma'lumotini tuzatish:";
const correctionSchema = z.object({ message: z.string().trim().min(5, 'Nima noto\'g\'ri ekanini yozing (kamida 5 belgi).').max(2000) });

const correctionRequest = asyncHandler(async (req, res) => {
  const parsed = correctionSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const user = await loadUser(req);
  const today = await prisma.task.count({
    where: { creatorId: user.id, title: { startsWith: CORRECTION_PREFIX }, createdAt: { gte: tashkentDayStart() } },
  });
  if (today >= 3) return res.status(429).json({ error: "Bugun 3 ta so'rov yuborilgan. Ertaga qayta urinib ko'ring." });

  const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null, id: { not: user.id } }, select: { id: true } });
  const profileInfo = [
    `F.I.Sh.: ${user.fullName}`,
    `Login: ${user.email}`,
    `Lavozim: ${user.staff?.position || '—'}`,
    `Laboratoriya: ${user.lab?.nameUz || user.staff?.laboratory?.nameUz || '—'}`,
  ].join('\n');

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: `${CORRECTION_PREFIX} ${user.fullName}`.slice(0, 300),
        description: `${parsed.data.message}\n\n---\n${profileInfo}`,
        creatorId: user.id,
        relatedType: 'BOSHQA',
        relatedLabel: 'Profil',
        assignees: { create: admins.map((a) => ({ userId: a.id })) },
      },
    });
    await tx.taskActivity.create({ data: { taskId: created.id, userId: user.id, action: 'CREATED', meta: { title: created.title } } });
    await notifyUsers(tx, admins.map((a) => a.id), { type: 'TASK_ASSIGNED', title: `${user.fullName}: profil ma'lumotini tuzatish so'rovi`, taskId: created.id, exceptUserId: user.id });
    return created;
  });
  res.status(201).json({ ok: true, taskId: task.id, remainingToday: 2 - today });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  listSessions,
  revokeSession,
  revokeOthers,
  listLogins,
  summary,
  activity,
  correctionRequest,
};
