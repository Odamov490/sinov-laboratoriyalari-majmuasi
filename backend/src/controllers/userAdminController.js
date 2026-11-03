const argon2 = require('argon2');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { LOGIN_EMAIL_DOMAIN } = require('../config/env');
const { normalizeLogin, isValidLogin, passwordSchema, generatePassword, effectiveLabId } = require('../utils/accounts');
const { buildLogins } = require('../utils/staffLogin');
const { syncUserSafe } = require('../services/chat/membership');

const ROLES = ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'];
// Roles a bulk "accounts from specialists" run may hand out (never SUPER_ADMIN).
const BULK_ROLES = ['STAFF', 'EDITOR', 'MANAGER'];

const loginField = z
  .string()
  .trim()
  .min(1, 'Login kiriting.')
  .transform(normalizeLogin)
  .refine(isValidLogin, "Login noto'g'ri (faqat lotin harflari, raqam, nuqta).");

const createSchema = z.object({
  fullName: z.string().trim().min(2),
  email: loginField,
  password: passwordSchema,
  role: z.enum(ROLES),
  labId: z.string().uuid().nullable().optional(),
});

const updateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
  labId: z.string().uuid().nullable().optional(),
  // Faqat SUPER_ADMIN (users moduli): shu hisob uchun chatni o'chirish.
  chatEnabled: z.boolean().optional(),
});

const USER_INCLUDE = {
  lab: { select: { nameUz: true } },
  staff: { select: { id: true, position: true, laboratoryId: true, laboratory: { select: { nameUz: true } } } },
};

// Never includes the password hash or lock counters.
const safeUser = (u) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  labId: u.labId,
  labName: u.lab?.nameUz || u.staff?.laboratory?.nameUz || null,
  effectiveLabId: effectiveLabId(u),
  staffId: u.staffId,
  position: u.staff?.position || null,
  isActive: u.isActive,
  chatEnabled: u.chatEnabled,
  mustChangePassword: u.mustChangePassword,
  lastLoginAt: u.lastLoginAt,
  locked: Boolean(u.lockedUntil && u.lockedUntil > new Date()),
  createdAt: u.createdAt,
});

// Responses carrying a one-time plain password must never be cached.
const noStore = (res) => res.set('Cache-Control', 'no-store');

const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: USER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items: users.map(safeUser), total: users.length });
});

const createUser = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: { fullName: data.fullName, email: data.email, role: data.role, labId: data.labId || null, passwordHash },
    include: USER_INCLUDE,
  });
  await syncUserSafe(user.id);
  res.status(201).json(safeUser(user));
});

const updateUser = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const update = { ...data };
  delete update.password;
  if (data.password) update.passwordHash = await argon2.hash(data.password);
  // Re-activating an account also clears a login lock.
  if (data.isActive === true) Object.assign(update, { failedLoginCount: 0, lockedUntil: null });
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: update,
    include: USER_INCLUDE,
  });
  await syncUserSafe(user.id);
  res.json(safeUser(user));
});

const deleteUser = asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
  await syncUserSafe(req.params.id);
  res.status(204).send();
});

// GET /admin/users/staff-without-account — active specialists with no
// login yet (for the "Mutaxassislardan hisob yaratish" dialog and filter).
const listStaffWithoutAccount = asyncHandler(async (req, res) => {
  const staff = await prisma.staff.findMany({
    where: { deletedAt: null, isActive: true, account: null },
    select: { id: true, fullName: true, position: true, laboratoryId: true, laboratory: { select: { nameUz: true } } },
    orderBy: [{ laboratoryId: 'asc' }, { fullName: 'asc' }],
  });
  res.json({
    items: staff.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      position: s.position,
      laboratoryId: s.laboratoryId,
      laboratoryName: s.laboratory?.nameUz || null,
    })),
  });
});

const fromStaffSchema = z.object({
  items: z
    .array(z.object({ staffId: z.string().uuid(), email: z.string().trim().max(200).optional().nullable() }))
    .min(1, 'Kamida bitta mutaxassisni tanlang.')
    .max(500),
  role: z.enum(BULK_ROLES).default('STAFF'),
  dryRun: z.boolean().default(true),
});

// POST /admin/users/from-staff — bulk accounts for specialists.
// dryRun=true: the proposed login per row (generated, or the edited one
// checked for format/uniqueness) with a status; nothing is written.
// dryRun=false: creates accounts for the rows that are "ok" and returns each
// one-time temporary password once (they cannot be fetched again).
const createFromStaff = asyncHandler(async (req, res) => {
  const { items, role, dryRun } = fromStaffSchema.parse(req.body);

  const [allStaff, users] = await Promise.all([
    prisma.staff.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        position: true,
        isActive: true,
        laboratoryId: true,
        laboratory: { select: { nameUz: true } },
        account: { select: { id: true } },
      },
    }),
    prisma.user.findMany({ select: { email: true } }),
  ]);
  const takenEmails = new Set(users.map((u) => u.email.toLowerCase()));
  const staffById = new Map(allStaff.map((s) => [s.id, s]));

  // Generated over every active specialist (with or without an account), so
  // a run's logins don't depend on which rows were ticked.
  const generated = buildLogins(
    allStaff.filter((s) => s.isActive).map((s) => ({ id: s.id, fullName: s.fullName, hasAccount: Boolean(s.account) })),
    takenEmails,
    LOGIN_EMAIL_DOMAIN
  );

  const seen = new Set();
  const rows = items.map(({ staffId, email: edited }) => {
    const s = staffById.get(staffId);
    const base = {
      staffId,
      fullName: s?.fullName || null,
      position: s?.position || null,
      laboratoryId: s?.laboratoryId || null,
      laboratoryName: s?.laboratory?.nameUz || null,
    };
    if (!s) return { ...base, email: null, givenName: null, status: 'error', message: 'Mutaxassis topilmadi.' };
    if (!s.isActive) return { ...base, email: null, givenName: null, status: 'error', message: 'Mutaxassis nofaol.' };
    if (s.account) return { ...base, email: null, givenName: null, status: 'skipped', message: 'Hisobi allaqachon bor.' };

    const gen = generated.get(staffId) || {};
    const email = edited ? normalizeLogin(edited) : gen.email;
    let status = 'ok';
    let message = null;
    if (!email) {
      status = 'review';
      message = `Tekshirish kerak: ${gen.review || 'login aniqlanmadi'}. Loginni qo'lda kiriting.`;
    } else if (!isValidLogin(email)) {
      status = 'error';
      message = "Login noto'g'ri (faqat lotin harflari, raqam, nuqta).";
    } else if (takenEmails.has(email) || seen.has(email)) {
      status = 'error';
      message = 'Bu login band.';
    }
    if (email) seen.add(email);
    return { ...base, givenName: gen.given || null, email, edited: Boolean(edited), status, message };
  });

  if (dryRun) return res.json({ dryRun: true, role, rows });

  const toCreate = rows.filter((r) => r.status === 'ok');
  const created = [];
  // One transaction: either every listed account is created or none is.
  await prisma.$transaction(async (tx) => {
    for (const r of toCreate) {
      const password = generatePassword();
      const user = await tx.user.create({
        data: {
          fullName: r.fullName,
          email: r.email,
          role,
          staffId: r.staffId,
          labId: r.laboratoryId,
          passwordHash: await argon2.hash(password),
          mustChangePassword: true,
        },
        select: { id: true },
      });
      created.push({
        staffId: r.staffId,
        userId: user.id,
        fullName: r.fullName,
        laboratoryName: r.laboratoryName,
        email: r.email,
        password,
      });
    }
  }, { timeout: 120000 });
  for (const c of created) await syncUserSafe(c.userId);

  noStore(res);
  res.status(201).json({
    dryRun: false,
    role,
    created,
    notCreated: rows.filter((r) => r.status !== 'ok').map(({ staffId, fullName, status, message }) => ({ staffId, fullName, status, message })),
  });
});

// POST /admin/users/:id/reset-password — a new one-time temporary password
// (shown once), forced change at next login, lock cleared.
const resetPassword = asyncHandler(async (req, res) => {
  const password = generatePassword();
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      passwordHash: await argon2.hash(password),
      mustChangePassword: true,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    include: USER_INCLUDE,
  });
  noStore(res);
  res.json({ userId: user.id, fullName: user.fullName, laboratoryName: safeUser(user).labName, email: user.email, password });
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listStaffWithoutAccount,
  createFromStaff,
  resetPassword,
};
