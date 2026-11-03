// Who may see and change which task — kept in one place so the rules are
// easy to read and adjust. Every task endpoint checks the object itself
// (not just the role): a task outside visibleWhere() simply doesn't exist
// for the caller (404).
//
//  SUPER_ADMIN      sees and manages every task.
//  MANAGER          sees their laboratory's tasks plus ones they created or
//                   are assigned to (no laboratory: only the latter); may
//                   assign anyone; manages tasks of their laboratory and
//                   their own.
//  EDITOR / STAFF   see only tasks they created or are assigned to; create
//                   tasks and assign colleagues of their own laboratory
//                   (no laboratory: only themselves); change the status of,
//                   comment on and attach files to tasks assigned to them.

const prisma = require('../config/prisma');
const { effectiveLabId } = require('./accounts');

const OPEN_STATUSES = ['YANGI', 'JARAYONDA', 'TEKSHIRUVDA'];
const CAN_ASSIGN_ANYONE = ['SUPER_ADMIN', 'MANAGER'];

// The caller with their effective laboratory (own labId, else the linked
// specialist card's), read fresh from the DB.
async function loadActor(req) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, role: true, fullName: true, labId: true, staff: { select: { laboratoryId: true } } },
  });
  return { id: user.id, role: user.role, fullName: user.fullName, labId: effectiveLabId(user) };
}

const involved = (actor) => [{ creatorId: actor.id }, { assignees: { some: { userId: actor.id } } }];

function visibleWhere(actor) {
  if (actor.role === 'SUPER_ADMIN') return {};
  if (actor.role === 'MANAGER' && actor.labId) return { OR: [{ laboratoryId: actor.labId }, ...involved(actor)] };
  return { OR: involved(actor) };
}

const isAssignee = (task, actor) => (task.assignees || []).some((a) => a.userId === actor.id);

// Edit fields, assignees, delete.
function canManage(task, actor) {
  if (actor.role === 'SUPER_ADMIN') return true;
  if (task.creatorId === actor.id) return true;
  return actor.role === 'MANAGER' && Boolean(actor.labId) && task.laboratoryId === actor.labId;
}

// Status, checklist ticks, comments, files.
const canWork = (task, actor) => canManage(task, actor) || isAssignee(task, actor);

// Users the caller may pick as assignees.
function assignableWhere(actor) {
  const base = { isActive: true, deletedAt: null };
  if (CAN_ASSIGN_ANYONE.includes(actor.role)) return base;
  if (!actor.labId) return { ...base, id: actor.id };
  return {
    ...base,
    OR: [{ labId: actor.labId }, { labId: null, staff: { is: { laboratoryId: actor.labId } } }],
  };
}

// Throws 403 unless every id is assignable by the caller.
async function assertAssignable(userIds, actor) {
  const ids = [...new Set(userIds)];
  if (!ids.length) return [];
  const allowed = await prisma.user.findMany({ where: { ...assignableWhere(actor), id: { in: ids } }, select: { id: true } });
  if (allowed.length !== ids.length) {
    const err = new Error("Tanlangan xodimlardan biriga vazifa tayinlay olmaysiz.");
    err.status = 403;
    throw err;
  }
  return ids;
}

// Laboratory a new/edited task belongs to: free choice for SUPER_ADMIN and
// MANAGER, otherwise always the caller's own laboratory.
const taskLaboratory = (requested, actor) => (CAN_ASSIGN_ANYONE.includes(actor.role) ? requested ?? actor.labId : actor.labId);

module.exports = {
  OPEN_STATUSES,
  loadActor,
  visibleWhere,
  isAssignee,
  canManage,
  canWork,
  assignableWhere,
  assertAssignable,
  taskLaboratory,
};
