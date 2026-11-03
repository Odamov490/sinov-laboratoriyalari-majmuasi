const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const LIMIT = 30;

// GET /admin/notifications — the caller's own latest notifications.
const listNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      select: { id: true, type: true, title: true, linkUrl: true, taskId: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  res.json({ items, unreadCount });
});

// POST /admin/notifications/:id/read — only one's own notification.
const readNotification = asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.sub, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ updated: count });
});

// POST /admin/notifications/read-all
const readAllNotifications = asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.user.sub, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ updated: count });
});

module.exports = { listNotifications, readNotification, readAllNotifications };
