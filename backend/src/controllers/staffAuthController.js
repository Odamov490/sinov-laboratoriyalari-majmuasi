const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { signStaffAccessToken, signStaffRefreshToken, verifyToken, cookieOptions } = require('../utils/tokens');

// Fields a staff member may see about their own record. Never includes
// passportSeries/passportNumber/pinfl (the login credentials themselves)
// or `notes` (admin-only HR commentary).
const SAFE_STAFF_SELECT = {
  id: true,
  fullName: true,
  position: true,
  specialization: true,
  experienceYears: true,
  email: true,
  phone: true,
  photo: true,
  laboratoryId: true,
  laboratory: { select: { id: true, nameUz: true, nameRu: true, nameEn: true } },
  staffNumber: true,
  employeeCode: true,
  hireDate: true,
  birthDate: true,
  address: true,
  lastLoginAt: true,
};

// Fields a staff member may edit on their own profile. Identity/employment
// fields (name, position, passport data, lab assignment, etc.) stay
// admin-only, edited via the existing /admin/staff CRUD.
const SELF_EDITABLE_FIELDS = ['email', 'phone', 'photo', 'specialization', 'experienceYears'];

const loginSchema = z.object({
  passportSeries: z.string().trim().min(1),
  passportNumber: z.string().trim().min(1),
  pinfl: z.string().trim().min(1),
});

const login = asyncHandler(async (req, res) => {
  const { passportSeries, passportNumber, pinfl } = loginSchema.parse(req.body);

  const staff = await prisma.staff.findFirst({
    where: {
      passportSeries: { equals: passportSeries, mode: 'insensitive' },
      passportNumber,
      deletedAt: null,
    },
  });

  const invalid = () => res.status(401).json({ error: "Pasport ma'lumotlari yoki PINFL noto'g'ri." });

  if (!staff) return invalid();

  if (staff.pinfl !== pinfl) {
    await prisma.staffActivityLog.create({
      data: { staffId: staff.id, action: 'LOGIN_FAILED', ipAddress: req.ip },
    });
    return invalid();
  }

  await prisma.$transaction([
    prisma.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } }),
    prisma.staffActivityLog.create({
      data: { staffId: staff.id, action: 'LOGIN', ipAddress: req.ip },
    }),
  ]);

  const accessToken = signStaffAccessToken(staff);
  const refreshToken = signStaffRefreshToken(staff);

  res.cookie('staffAccessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('staffRefreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  const profile = await prisma.staff.findUnique({ where: { id: staff.id }, select: SAFE_STAFF_SELECT });
  res.json({ staff: profile, accessToken });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('staffAccessToken', cookieOptions);
  res.clearCookie('staffRefreshToken', cookieOptions);
  res.json({ success: true });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.staffRefreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token topilmadi.' });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Refresh token yaroqsiz.' });
  }
  if (payload.role !== 'STAFF' || payload.type !== 'staff-refresh') {
    return res.status(401).json({ error: "Noto'g'ri token turi." });
  }

  const staff = await prisma.staff.findFirst({ where: { id: payload.sub, deletedAt: null } });
  if (!staff) return res.status(401).json({ error: 'Foydalanuvchi topilmadi.' });

  const accessToken = signStaffAccessToken(staff);
  res.cookie('staffAccessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json({ accessToken });
});

const me = asyncHandler(async (req, res) => {
  const staff = await prisma.staff.findFirst({
    where: { id: req.staff.sub, deletedAt: null },
    select: SAFE_STAFF_SELECT,
  });
  if (!staff) return res.status(404).json({ error: 'Topilmadi.' });
  res.json(staff);
});

// An unset field arrives from the frontend as '' rather than null/undefined
// -- treat it the same way so clearing a field doesn't trip min-length/format
// validation on an empty string.
const emptyToNull = (val) => (val === '' ? null : val);

const updateMeSchema = z.object({
  email: z.preprocess(emptyToNull, z.string().email().nullish()),
  phone: z.preprocess(emptyToNull, z.string().trim().min(3).nullish()),
  photo: z.preprocess(emptyToNull, z.string().nullish()),
  specialization: z.preprocess(emptyToNull, z.string().nullish()),
  experienceYears: z.preprocess(emptyToNull, z.coerce.number().int().min(0).nullish()),
});

const updateMe = asyncHandler(async (req, res) => {
  const parsed = updateMeSchema.parse(req.body);
  const data = {};
  const changedFields = [];
  for (const field of SELF_EDITABLE_FIELDS) {
    if (field in req.body) {
      data[field] = parsed[field];
      changedFields.push(field);
    }
  }

  const staff = await prisma.staff.update({
    where: { id: req.staff.sub },
    data,
    select: SAFE_STAFF_SELECT,
  });

  if (changedFields.length) {
    await prisma.staffActivityLog.create({
      data: { staffId: req.staff.sub, action: 'PROFILE_UPDATE', detail: changedFields.join(', ') },
    });
  }

  res.json(staff);
});

const myActivity = asyncHandler(async (req, res) => {
  const logs = await prisma.staffActivityLog.findMany({
    where: { staffId: req.staff.sub },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(logs);
});

// Super Admin oversight: lists activity across all staff, optionally
// filtered to one staff member.
const listActivity = asyncHandler(async (req, res) => {
  const { staffId, page = 1, pageSize = 30 } = req.query;
  const take = Math.min(Number(pageSize) || 30, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = staffId ? { staffId } : {};

  const [items, total] = await Promise.all([
    prisma.staffActivityLog.findMany({
      where,
      include: { staff: { select: { id: true, fullName: true, position: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.staffActivityLog.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

module.exports = { login, logout, refresh, me, updateMe, myActivity, listActivity };
