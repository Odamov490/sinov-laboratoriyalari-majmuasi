const argon2 = require('argon2');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { signAccessToken, signRefreshToken, verifyToken, cookieOptions } = require('../utils/tokens');
const { normalizeLogin, passwordSchema, effectiveLabId } = require('../utils/accounts');

// One message for unknown login, wrong password, inactive and locked account
// alike, so a response never reveals whether an account exists.
const LOGIN_FAILED = "Login yoki parol noto'g'ri, yoki urinishlar ko'p. 15 daqiqadan keyin qayta urinib ko'ring.";
const MAX_FAILED_LOGINS = 10;
const LOCK_MS = 15 * 60 * 1000;

// Verifying against a dummy hash for unknown logins keeps response timing
// the same as for a real account with a wrong password.
const dummyHashPromise = argon2.hash('timing-equaliser-not-a-real-password');

const loginSchema = z.object({
  email: z.string().max(200),
  password: z.string().max(200),
});

const ME_INCLUDE = {
  lab: { select: { id: true, nameUz: true } },
  staff: { select: { id: true, position: true, laboratoryId: true, laboratory: { select: { nameUz: true } } } },
};

// Shape of the signed-in user for /auth/me and the login response.
function publicUser(user) {
  const labId = effectiveLabId(user);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    labId,
    labName: user.lab?.nameUz || user.staff?.laboratory?.nameUz || null,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    staff: user.staff
      ? {
          id: user.staff.id,
          laboratoryId: user.staff.laboratoryId,
          laboratoryName: user.staff.laboratory?.nameUz || null,
          position: user.staff.position,
        }
      : null,
  };
}

function setAuthCookies(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  return accessToken;
}

const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: LOGIN_FAILED });
  const email = normalizeLogin(parsed.data.email);
  const { password } = parsed.data;

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user) {
    await argon2.verify(await dummyHashPromise, password).catch(() => false);
    return res.status(401).json({ error: LOGIN_FAILED });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(401).json({ error: LOGIN_FAILED });
  }

  const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!valid) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: { increment: 1 } },
      select: { failedLoginCount: true },
    });
    if (updated.failedLoginCount >= MAX_FAILED_LOGINS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCK_MS) },
      });
    }
    return res.status(401).json({ error: LOGIN_FAILED });
  }

  if (!user.isActive || user.deletedAt) {
    return res.status(401).json({ error: LOGIN_FAILED });
  }

  const signedIn = await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    include: ME_INCLUDE,
  });

  const accessToken = setAuthCookies(res, signedIn);
  res.json({ user: publicUser(signedIn), accessToken });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, include: ME_INCLUDE });
  if (!user || !user.isActive || user.deletedAt) return res.status(401).json({ error: 'Hisob faol emas.' });
  res.json(publicUser(user));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token topilmadi.' });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Refresh token yaroqsiz.' });
  }
  if (payload.type !== 'refresh') return res.status(401).json({ error: 'Noto\'g\'ri token turi.' });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.deletedAt) return res.status(401).json({ error: 'Foydalanuvchi topilmadi.' });

  const accessToken = signAccessToken(user);
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json({ accessToken });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Joriy parolni kiriting.').max(200),
  newPassword: passwordSchema,
});

// POST /auth/change-password — the one action allowed while
// mustChangePassword is set; also used from "Mening profilim".
const changePassword = asyncHandler(async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user || !user.isActive || user.deletedAt) return res.status(401).json({ error: 'Hisob faol emas.' });

  const valid = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
  if (!valid) return res.status(400).json({ error: "Joriy parol noto'g'ri." });
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'Yangi parol joriy paroldan farq qilishi kerak.' });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await argon2.hash(newPassword),
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    include: ME_INCLUDE,
  });
  const accessToken = setAuthCookies(res, updated);
  res.json({ user: publicUser(updated), accessToken });
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
});

// Any admin-panel user updating their own name -- never another user's.
// Passwords change only through /auth/change-password (policy enforced there).
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName } = updateProfileSchema.parse(req.body);
  const updated = await prisma.user.update({ where: { id: req.user.sub }, data: { fullName }, include: ME_INCLUDE });
  res.json(publicUser(updated));
});

module.exports = { login, logout, me, refresh, changePassword, updateProfile };
