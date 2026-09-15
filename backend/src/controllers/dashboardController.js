const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const DAY_MS = 24 * 60 * 60 * 1000;

const MOVEMENT_TEXT = {
  REGISTRATSIYA: (code) => `${code} namunasini ro'yxatga oldingiz`,
  CHIQARISH: (code) => `${code} namunasini chiqardingiz`,
  QABUL_QILISH: (code) => `${code} namunasini qabul qildingiz`,
  YAKUNLASH: (code) => `${code} namunasi bo'yicha ishni yakunladingiz`,
};

// Everything here is scoped to req.user.sub -- a MANAGER/EDITOR only ever
// sees their own role-relevant counts and their own recent actions, never
// another admin's.
const getMyDashboard = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

  let roleStats = [];

  if (user.role === 'MANAGER') {
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
    const appWhere = { createdAt: { gte: sevenDaysAgo } };
    if (user.labId) appWhere.service = { laboratoryId: user.labId };

    const [newApplications, pendingMessages] = await Promise.all([
      prisma.application.count({ where: appWhere }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);
    roleStats = [
      { label: "Oxirgi 7 kunda kelgan arizalar", value: newApplications },
      { label: 'Javob kutayotgan murojaatlar', value: pendingMessages },
    ];
  } else if (user.role === 'EDITOR') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);
    const [published, drafts] = await Promise.all([
      prisma.news.count({ where: { isPublished: true, publishedAt: { gte: thirtyDaysAgo } } }),
      prisma.news.count({ where: { isPublished: false } }),
    ]);
    // News has no per-author field, so these are sitewide totals, not
    // personal to this editor -- labelled as such rather than implied.
    roleStats = [
      { label: 'Oxirgi 30 kunda nashr etilgan yangiliklar (umumiy)', value: published },
      { label: 'Qoralama holatidagi yangiliklar', value: drafts },
    ];
  }

  const [movements, testItems] = await Promise.all([
    prisma.sampleMovement.findMany({
      where: { performedByUserId: user.id },
      include: { sample: { select: { code: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.applicationTestItem.findMany({
      where: { addedByUserId: user.id },
      include: { application: { select: { applicationNumber: true } }, service: { select: { nameUz: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const recentActivity = [
    ...movements.map((m) => ({
      id: m.id,
      text: (MOVEMENT_TEXT[m.action] || (() => "namuna bilan ishladingiz"))(m.sample.code),
      createdAt: m.createdAt,
    })),
    ...testItems.map((t) => ({
      id: t.id,
      text: `${t.application.applicationNumber} arizasiga ${t.service.nameUz} xizmatini qo'shdingiz`,
      createdAt: t.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.json({ roleStats, recentActivity });
});

// Header notification dropdown -- unread contact messages + not-yet-reviewed
// applications, merged. Only meaningful for SUPER_ADMIN/MANAGER (the roles
// that actually handle these inboxes); other roles just get an empty list.
const getNotifications = asyncHandler(async (req, res) => {
  if (!['SUPER_ADMIN', 'MANAGER'].includes(req.user.role)) {
    return res.json({ items: [], total: 0 });
  }

  const [messages, applications, unreadCount, newCount] = await Promise.all([
    prisma.contactMessage.findMany({ where: { isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.application.findMany({ where: { status: 'QABUL_QILINDI' }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.application.count({ where: { status: 'QABUL_QILINDI' } }),
  ]);

  const items = [
    ...messages.map((m) => ({
      id: m.id,
      type: 'message',
      text: `${m.fullName} dan murojaat`,
      createdAt: m.createdAt,
    })),
    ...applications.map((a) => ({
      id: a.id,
      type: 'application',
      text: `Yangi ariza: ${a.applicationNumber}`,
      createdAt: a.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  res.json({ items, total: unreadCount + newCount });
});

module.exports = { getMyDashboard, getNotifications };
