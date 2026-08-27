// Module-level RBAC mapping per spec:
// Super Admin -> everything
// Manager -> applications, services, prices, laboratories
// Editor -> news, documents, gallery, FAQ
const MODULE_ACCESS = {
  laboratories: ['SUPER_ADMIN', 'MANAGER'],
  services: ['SUPER_ADMIN', 'MANAGER'],
  prices: ['SUPER_ADMIN', 'MANAGER'],
  applications: ['SUPER_ADMIN', 'MANAGER'],
  news: ['SUPER_ADMIN', 'EDITOR'],
  documents: ['SUPER_ADMIN', 'EDITOR'],
  gallery: ['SUPER_ADMIN', 'EDITOR'],
  faq: ['SUPER_ADMIN', 'EDITOR'],
  standards: ['SUPER_ADMIN', 'MANAGER'],
  staff: ['SUPER_ADMIN', 'MANAGER'],
  equipment: ['SUPER_ADMIN', 'MANAGER'],
  users: ['SUPER_ADMIN'],
  settings: ['SUPER_ADMIN'],
};

function requireModule(moduleName) {
  const allowed = MODULE_ACCESS[moduleName] || ['SUPER_ADMIN'];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi.' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: bu bo\'lim uchun ruxsat yo\'q.' });
    }
    next();
  };
}

module.exports = { requireModule, MODULE_ACCESS };
