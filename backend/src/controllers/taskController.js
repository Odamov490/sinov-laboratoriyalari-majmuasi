const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  OPEN_STATUSES,
  loadActor,
  visibleWhere,
  canManage,
  canWork,
  assignableWhere,
  assertAssignable,
  taskLaboratory,
} = require('../utils/taskPermissions');
const { tashkentToday, dateOnly, addDays, notifyUsers } = require('../services/inAppNotifications');

const STATUSES = ['YANGI', 'JARAYONDA', 'TEKSHIRUVDA', 'BAJARILDI', 'BEKOR_QILINDI'];
const PRIORITIES = ['PAST', 'ORTACHA', 'YUQORI', 'SHOSHILINCH'];
const RELATED_TYPES = ['ARIZA', 'NAMUNA', 'NOMUVOFIQLIK', 'JURNAL', 'BOSHQA'];
const STATUS_LABELS = {
  YANGI: 'Yangi',
  JARAYONDA: 'Jarayonda',
  TEKSHIRUVDA: 'Tekshiruvda',
  BAJARILDI: 'Bajarildi',
  BEKOR_QILINDI: 'Bekor qilindi',
};
const MAX_PAGE_SIZE = 500;

const notFound = (res) => res.status(404).json({ error: 'Vazifa topilmadi.' });
const forbidden = (res) => res.status(403).json({ error: "Bu amal uchun ruxsat yo'q." });

const userBrief = { select: { id: true, fullName: true } };
const LIST_INCLUDE = {
  creator: userBrief,
  laboratory: { select: { id: true, nameUz: true } },
  assignees: { select: { userId: true, user: userBrief } },
  checklist: { select: { done: true } },
  _count: { select: { comments: true, attachments: true } },
};
const DETAIL_INCLUDE = {
  creator: userBrief,
  laboratory: { select: { id: true, nameUz: true } },
  assignees: { select: { userId: true, user: userBrief } },
  checklist: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
  comments: { orderBy: { createdAt: 'asc' }, include: { author: userBrief } },
  attachments: { orderBy: { createdAt: 'asc' }, include: { uploadedBy: userBrief } },
  activities: { orderBy: { createdAt: 'desc' }, take: 100, include: { user: userBrief } },
};

const ymd = (d) => (d ? d.toISOString().slice(0, 10) : null);
const isOverdue = (task, today) => Boolean(task.dueDate) && OPEN_STATUSES.includes(task.status) && ymd(task.dueDate) < today;

function serializeTask(task, actor, today = tashkentToday()) {
  const out = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: ymd(task.dueDate),
    completedAt: task.completedAt,
    creator: task.creator,
    laboratory: task.laboratory,
    relatedType: task.relatedType,
    relatedId: task.relatedId,
    relatedLabel: task.relatedLabel,
    assignees: (task.assignees || []).map((a) => a.user),
    overdue: isOverdue(task, today),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    permissions: { manage: canManage(task, actor), work: canWork(task, actor) },
  };
  if (task._count) {
    out.checklistTotal = task.checklist.length;
    out.checklistDone = task.checklist.filter((c) => c.done).length;
    out.commentCount = task._count.comments;
    out.attachmentCount = task._count.attachments;
  } else {
    out.checklist = task.checklist;
    out.comments = task.comments;
    out.attachments = task.attachments;
    out.activities = task.activities;
  }
  return out;
}

// The task if the caller may see it (with assignees for permission checks).
async function findVisible(id, actor, include = { assignees: { select: { userId: true } } }) {
  return prisma.task.findFirst({ where: { id, deletedAt: null, ...visibleWhere(actor) }, include });
}

const logActivity = (db, taskId, actor, action, meta = null) =>
  db.taskActivity.create({ data: { taskId, userId: actor.id, action, ...(meta && { meta }) } });

// ---------- list / summary / assignable ----------

const listTasks = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const today = tashkentToday();
  const q = req.query;
  const and = [visibleWhere(actor)];
  const where = { deletedAt: null };

  const statuses = String(q.status || '')
    .split(',')
    .filter((s) => STATUSES.includes(s));
  if (statuses.length) where.status = { in: statuses };
  if (PRIORITIES.includes(q.priority)) where.priority = q.priority;
  if (q.assigneeId) where.assignees = { some: { userId: String(q.assigneeId) } };
  if (q.laboratoryId) where.laboratoryId = String(q.laboratoryId);
  if (q.mine === '1') and.push({ OR: [{ creatorId: actor.id }, { assignees: { some: { userId: actor.id } } }] });
  if (q.due === 'today') where.dueDate = dateOnly(today);
  if (q.due === 'week') {
    // Today through Sunday of the current week.
    const dow = dateOnly(today).getUTCDay(); // 0 = Sunday
    where.dueDate = { gte: dateOnly(today), lte: dateOnly(addDays(today, dow === 0 ? 0 : 7 - dow)) };
  }
  if (q.due === 'overdue') {
    where.dueDate = { lt: dateOnly(today) };
    if (!statuses.length) where.status = { in: OPEN_STATUSES };
  }
  const search = String(q.q || '').trim();
  if (search) {
    and.push({
      OR: ['title', 'description', 'relatedLabel'].map((f) => ({ [f]: { contains: search, mode: 'insensitive' } })),
    });
  }
  where.AND = and;

  const pageSize = Math.min(Math.max(Number(q.pageSize) || 200, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number(q.page) || 1, 1);
  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);
  res.json({ items: items.map((t) => serializeTask(t, actor, today)), total, page, pageSize });
});

// "Mine" for the badge and dashboard card: open tasks assigned to me, or
// created by me with nobody assigned.
const mineWhere = (actor) => ({
  deletedAt: null,
  status: { in: OPEN_STATUSES },
  OR: [{ assignees: { some: { userId: actor.id } } }, { creatorId: actor.id, assignees: { none: {} } }],
});

const mySummary = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const today = tashkentToday();
  const where = mineWhere(actor);
  const [openCount, overdueCount, upcoming] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, dueDate: { lt: dateOnly(today) } } }),
    prisma.task.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { priority: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    }),
  ]);
  res.json({ openCount, overdueCount, upcoming: upcoming.map((t) => serializeTask(t, actor, today)) });
});

// GET /admin/tasks/assignable-users — only id, name and laboratory (no
// e-mail, role or account flags).
const assignableUsers = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const users = await prisma.user.findMany({
    where: assignableWhere(actor),
    select: {
      id: true,
      fullName: true,
      lab: { select: { nameUz: true } },
      staff: { select: { laboratory: { select: { nameUz: true } } } },
    },
    orderBy: { fullName: 'asc' },
  });
  res.json({
    items: users.map((u) => ({ id: u.id, fullName: u.fullName, laboratoryName: u.lab?.nameUz || u.staff?.laboratory?.nameUz || null })),
  });
});

// ---------- single task ----------

const getTask = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor, DETAIL_INCLUDE);
  if (!task) return notFound(res);
  res.json(serializeTask(task, actor));
});

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null));

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Sarlavha kiriting.').max(300),
  description: z.string().trim().max(10000).nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: dateField,
  assigneeIds: z.array(z.string().uuid()).max(50).optional(),
  laboratoryId: z.string().uuid().nullable().optional(),
  relatedType: z.enum(RELATED_TYPES).nullable().optional(),
  relatedId: z.string().trim().max(100).nullable().optional(),
  relatedLabel: z.string().trim().max(300).nullable().optional(),
});

const createTask = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const data = taskSchema.parse(req.body);
  const assigneeIds = await assertAssignable(data.assigneeIds || [], actor);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'ORTACHA',
        dueDate: data.dueDate ? dateOnly(data.dueDate) : null,
        creatorId: actor.id,
        laboratoryId: taskLaboratory(data.laboratoryId, actor) || null,
        relatedType: data.relatedType || null,
        relatedId: data.relatedId || null,
        relatedLabel: data.relatedLabel || null,
        assignees: { create: assigneeIds.map((userId) => ({ userId })) },
      },
    });
    await logActivity(tx, created.id, actor, 'CREATED', { title: created.title });
    if (assigneeIds.length) {
      await logActivity(tx, created.id, actor, 'ASSIGNED', { added: assigneeIds });
      await notifyUsers(tx, assigneeIds, {
        type: 'TASK_ASSIGNED',
        title: `${actor.fullName} sizga vazifa tayinladi: ${created.title}`,
        taskId: created.id,
        exceptUserId: actor.id,
      });
    }
    return tx.task.findUnique({ where: { id: created.id }, include: DETAIL_INCLUDE });
  });
  res.status(201).json(serializeTask(task, actor));
});

const updateTask = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const existing = await findVisible(req.params.id, actor);
  if (!existing) return notFound(res);
  if (!canManage(existing, actor)) return forbidden(res);

  const data = taskSchema.partial().parse(req.body);
  const update = {};
  ['title', 'description', 'priority', 'relatedType', 'relatedId', 'relatedLabel'].forEach((f) => {
    if (f in data) update[f] = data[f] ?? null;
  });
  if ('title' in data && !data.title) delete update.title;
  if ('dueDate' in data) update.dueDate = data.dueDate ? dateOnly(data.dueDate) : null;
  if ('laboratoryId' in data) update.laboratoryId = taskLaboratory(data.laboratoryId, actor) || null;

  const before = existing.assignees.map((a) => a.userId);
  let added = [];
  let removed = [];
  if (data.assigneeIds) {
    const next = [...new Set(data.assigneeIds)];
    added = next.filter((id) => !before.includes(id));
    removed = before.filter((id) => !next.includes(id));
    // Only newly added people must be assignable by the caller.
    await assertAssignable(added, actor);
  }

  const changed = Object.keys(update).filter((k) => {
    const prev = k === 'dueDate' ? ymd(existing.dueDate) : existing[k];
    const next = k === 'dueDate' ? ymd(update.dueDate) : update[k];
    return (prev ?? null) !== (next ?? null);
  });

  const task = await prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id: existing.id }, data: update });
    if (removed.length) await tx.taskAssignee.deleteMany({ where: { taskId: existing.id, userId: { in: removed } } });
    if (added.length) await tx.taskAssignee.createMany({ data: added.map((userId) => ({ taskId: existing.id, userId })) });
    if (changed.length) await logActivity(tx, existing.id, actor, 'UPDATED', { fields: changed });
    if (added.length || removed.length) await logActivity(tx, existing.id, actor, 'ASSIGNED', { added, removed });
    if (added.length) {
      await notifyUsers(tx, added, {
        type: 'TASK_ASSIGNED',
        title: `${actor.fullName} sizga vazifa tayinladi: ${update.title || existing.title}`,
        taskId: existing.id,
        exceptUserId: actor.id,
      });
    }
    return tx.task.findUnique({ where: { id: existing.id }, include: DETAIL_INCLUDE });
  });
  res.json(serializeTask(task, actor));
});

const setStatus = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const existing = await findVisible(req.params.id, actor);
  if (!existing) return notFound(res);
  if (!canWork(existing, actor)) return forbidden(res);
  const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
  if (status === existing.status) {
    const same = await prisma.task.findUnique({ where: { id: existing.id }, include: DETAIL_INCLUDE });
    return res.json(serializeTask(same, actor));
  }

  const task = await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: existing.id },
      data: { status, completedAt: status === 'BAJARILDI' ? new Date() : null },
    });
    await logActivity(tx, existing.id, actor, 'STATUS', { from: existing.status, to: status });
    await notifyUsers(tx, [existing.creatorId], {
      type: 'TASK_STATUS',
      title: `"${existing.title}" holati: ${STATUS_LABELS[status]} (${actor.fullName})`,
      taskId: existing.id,
      exceptUserId: actor.id,
    });
    return tx.task.findUnique({ where: { id: existing.id }, include: DETAIL_INCLUDE });
  });
  res.json(serializeTask(task, actor));
});

const deleteTask = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const existing = await findVisible(req.params.id, actor);
  if (!existing) return notFound(res);
  if (!canManage(existing, actor)) return forbidden(res);
  await prisma.$transaction([
    prisma.task.update({ where: { id: existing.id }, data: { deletedAt: new Date() } }),
    prisma.taskActivity.create({ data: { taskId: existing.id, userId: actor.id, action: 'DELETED' } }),
  ]);
  res.status(204).send();
});

// ---------- checklist ----------

const addChecklistItem = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor);
  if (!task) return notFound(res);
  if (!canWork(task, actor)) return forbidden(res);
  const { text } = z.object({ text: z.string().trim().min(1).max(500) }).parse(req.body);
  const count = await prisma.taskChecklistItem.count({ where: { taskId: task.id } });
  const item = await prisma.taskChecklistItem.create({ data: { taskId: task.id, text, order: count } });
  await logActivity(prisma, task.id, actor, 'CHECKLIST', { added: text });
  res.status(201).json(item);
});

const updateChecklistItem = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor);
  if (!task) return notFound(res);
  if (!canWork(task, actor)) return forbidden(res);
  const data = z.object({ text: z.string().trim().min(1).max(500).optional(), done: z.boolean().optional() }).parse(req.body);
  const item = await prisma.taskChecklistItem.findFirst({ where: { id: req.params.itemId, taskId: task.id } });
  if (!item) return res.status(404).json({ error: 'Band topilmadi.' });
  const updated = await prisma.taskChecklistItem.update({ where: { id: item.id }, data });
  if ('done' in data && data.done !== item.done) {
    await logActivity(prisma, task.id, actor, 'CHECKLIST', { [data.done ? 'checked' : 'unchecked']: item.text });
  }
  res.json(updated);
});

const removeChecklistItem = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor);
  if (!task) return notFound(res);
  if (!canWork(task, actor)) return forbidden(res);
  const { count } = await prisma.taskChecklistItem.deleteMany({ where: { id: req.params.itemId, taskId: task.id } });
  if (!count) return res.status(404).json({ error: 'Band topilmadi.' });
  res.status(204).send();
});

// ---------- comments & files ----------

const addComment = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor);
  if (!task) return notFound(res);
  const { body } = z.object({ body: z.string().trim().min(1, 'Izoh yozing.').max(5000) }).parse(req.body);
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.taskComment.create({ data: { taskId: task.id, authorId: actor.id, body }, include: { author: userBrief } });
    await logActivity(tx, task.id, actor, 'COMMENT');
    // Everyone involved except the author.
    await notifyUsers(tx, [task.creatorId, ...task.assignees.map((a) => a.userId)], {
      type: 'TASK_COMMENT',
      title: `${actor.fullName} izoh yozdi: ${task.title}`,
      taskId: task.id,
      exceptUserId: actor.id,
    });
    return created;
  });
  res.status(201).json(comment);
});

// Files are uploaded through POST /admin/uploads first; here only the
// returned /uploads/... URL is attached.
const addAttachment = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor);
  if (!task) return notFound(res);
  if (!canWork(task, actor)) return forbidden(res);
  const data = z
    .object({
      fileUrl: z.string().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "Fayl manzili noto'g'ri."),
      fileName: z.string().trim().min(1).max(255),
    })
    .parse(req.body);
  const attachment = await prisma.taskAttachment.create({
    data: { taskId: task.id, fileUrl: data.fileUrl, fileName: data.fileName, uploadedById: actor.id },
    include: { uploadedBy: userBrief },
  });
  await logActivity(prisma, task.id, actor, 'ATTACHMENT', { added: data.fileName });
  res.status(201).json(attachment);
});

const removeAttachment = asyncHandler(async (req, res) => {
  const actor = await loadActor(req);
  const task = await findVisible(req.params.id, actor);
  if (!task) return notFound(res);
  const att = await prisma.taskAttachment.findFirst({ where: { id: req.params.attId, taskId: task.id } });
  if (!att) return res.status(404).json({ error: 'Fayl topilmadi.' });
  if (att.uploadedById !== actor.id && !canManage(task, actor)) return forbidden(res);
  await prisma.taskAttachment.delete({ where: { id: att.id } });
  await logActivity(prisma, task.id, actor, 'ATTACHMENT', { removed: att.fileName });
  res.status(204).send();
});

module.exports = {
  listTasks,
  mySummary,
  assignableUsers,
  getTask,
  createTask,
  updateTask,
  setStatus,
  deleteTask,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  addComment,
  addAttachment,
  removeAttachment,
};
