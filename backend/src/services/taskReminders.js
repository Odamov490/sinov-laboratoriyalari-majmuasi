// Daily 08:00 (Asia/Tashkent) reminders: tasks due tomorrow and overdue
// tasks. Recipients are the assignees, or the creator when nobody is
// assigned. At most one reminder of each kind per task per user per day,
// so a restart or a second run the same day sends nothing new.

const cron = require('node-cron');
const prisma = require('../config/prisma');
const { OPEN_STATUSES } = require('../utils/taskPermissions');
const { TZ, tashkentToday, dateOnly, addDays, tashkentDayStart, taskLink } = require('./inAppNotifications');

async function remind(type, where, title) {
  const tasks = await prisma.task.findMany({
    where: { deletedAt: null, status: { in: OPEN_STATUSES }, ...where },
    select: { id: true, title: true, creatorId: true, assignees: { select: { userId: true, user: { select: { isActive: true } } } } },
  });
  if (!tasks.length) return 0;

  const since = tashkentDayStart();
  const already = await prisma.notification.findMany({
    where: { type, taskId: { in: tasks.map((t) => t.id) }, createdAt: { gte: since } },
    select: { taskId: true, userId: true },
  });
  const sent = new Set(already.map((n) => `${n.taskId}:${n.userId}`));

  const data = [];
  for (const task of tasks) {
    const assignees = task.assignees.filter((a) => a.user.isActive).map((a) => a.userId);
    const recipients = assignees.length ? assignees : [task.creatorId];
    for (const userId of recipients) {
      if (sent.has(`${task.id}:${userId}`)) continue;
      data.push({ userId, type, title: title(task), taskId: task.id, linkUrl: taskLink(task.id) });
    }
  }
  if (data.length) await prisma.notification.createMany({ data });
  return data.length;
}

async function runTaskReminders() {
  const today = tashkentToday();
  const soon = await remind('TASK_DUE_SOON', { dueDate: dateOnly(addDays(today, 1)) }, (t) => `Ertaga muddati tugaydi: ${t.title}`);
  const overdue = await remind('TASK_OVERDUE', { dueDate: { lt: dateOnly(today) } }, (t) => `Muddati o'tgan vazifa: ${t.title}`);
  console.log(`[task-reminders] ${today}: due-soon ${soon}, overdue ${overdue}`);
  return { soon, overdue };
}

function startTaskReminders() {
  cron.schedule(
    '0 8 * * *',
    () => runTaskReminders().catch((err) => console.error('[task-reminders] failed:', err.message)),
    { timezone: TZ }
  );
}

module.exports = { startTaskReminders, runTaskReminders };
