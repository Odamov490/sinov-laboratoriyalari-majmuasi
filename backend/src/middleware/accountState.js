const prisma = require('../config/prisma');

// Runs after `authenticate` on every /admin route. Re-reads the account so a
// deactivated user loses access at once and a role change applies without a
// new login, and blocks everything while a temporary password is in use
// (only /auth/me, /auth/refresh, /auth/logout and /auth/change-password stay
// open, and those live outside /admin).
async function requireActiveAccount(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { isActive: true, deletedAt: true, role: true, mustChangePassword: true },
    });
    if (!user || !user.isActive || user.deletedAt) {
      return res.status(401).json({ error: 'Hisob faol emas.' });
    }
    req.user.role = user.role;
    // Vaqtinchalik parol: faqat parol almashtirish ochiq.
    if (user.mustChangePassword && !(req.method === 'PUT' && req.path === '/profile/password')) {
      return res.status(403).json({ error: 'Avval vaqtinchalik parolni almashtiring.', code: 'MUST_CHANGE_PASSWORD' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireActiveAccount };
