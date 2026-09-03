const argon2 = require('argon2');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { signAccessToken, signRefreshToken, verifyToken, cookieOptions } = require('../utils/tokens');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.deletedAt) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, labId: user.labId },
    accessToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: { lab: { select: { id: true, nameUz: true } } },
  });
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    labId: user.labId,
    labName: user.lab?.nameUz || null,
  });
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
  if (!user || !user.isActive) return res.status(401).json({ error: 'Foydalanuvchi topilmadi.' });

  const accessToken = signAccessToken(user);
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json({ accessToken });
});

module.exports = { login, logout, me, refresh };
