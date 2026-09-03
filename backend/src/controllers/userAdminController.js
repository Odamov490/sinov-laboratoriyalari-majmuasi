const argon2 = require('argon2');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'EDITOR']),
  labId: z.string().uuid().nullable().optional(),
});

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'EDITOR']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  labId: z.string().uuid().nullable().optional(),
});

const safeUser = (u) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  labId: u.labId,
  labName: u.lab?.nameUz || null,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { lab: { select: { nameUz: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items: users.map(safeUser), total: users.length });
});

const createUser = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: { fullName: data.fullName, email: data.email, role: data.role, labId: data.labId || null, passwordHash },
    include: { lab: { select: { nameUz: true } } },
  });
  res.status(201).json(safeUser(user));
});

const updateUser = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const update = { ...data };
  delete update.password;
  if (data.password) update.passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: update,
    include: { lab: { select: { nameUz: true } } },
  });
  res.json(safeUser(user));
});

const deleteUser = asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
  res.status(204).send();
});

module.exports = { listUsers, createUser, updateUser, deleteUser };
