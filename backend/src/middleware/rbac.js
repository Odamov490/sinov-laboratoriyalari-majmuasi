// Module-level RBAC mapping per spec:
// Super Admin -> everything
// Manager -> applications, services, prices, laboratories
// Editor -> news, documents, gallery, FAQ
// Staff (Xodim) -> tasks, notifications, profile only
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
  samples: ['SUPER_ADMIN', 'MANAGER'],
  tnved: ['SUPER_ADMIN', 'MANAGER'],
  testPrograms: ['SUPER_ADMIN', 'MANAGER'],
  settings: ['SUPER_ADMIN'],
  analytics: ['SUPER_ADMIN'],
  // Hisobot (sinovlar jurnali). Summa/shartnoma/to'lov maydonlarini kim
  // ko'rishi testJournalController'dagi FINANCE_ROLES'da belgilanadi.
  reports: ['SUPER_ADMIN', 'MANAGER'],
  // Hisobot spravochniklari (mahsulot turi, joy, buyurtmachi, narxlar)ni o'zgartirish.
  reports_admin: ['SUPER_ADMIN'],

  // SMK (Sifat Menejmenti Kompleksi, ISO/IEC 17025) — 20 quyi-modul, 6
  // fazada quriladi (hozir faqat smk_nonconformances va smk_complaints
  // mavjud; qolganlari keyingi fazalarda qo'shiladi — kalitlar oldindan
  // shu yerda turadi, chunki bu faqat statik ruxsat ro'yxati).
  smk_nonconformances: ['SUPER_ADMIN', 'MANAGER'],
  smk_complaints: ['SUPER_ADMIN', 'MANAGER'],
  smk_documents: ['SUPER_ADMIN', 'MANAGER'],
  smk_audits: ['SUPER_ADMIN'],
  smk_calibration: ['SUPER_ADMIN', 'MANAGER'],
  smk_training: ['SUPER_ADMIN', 'MANAGER'],
  smk_qc: ['SUPER_ADMIN', 'MANAGER'],
  smk_pt: ['SUPER_ADMIN'],
  smk_uncertainty: ['SUPER_ADMIN'],
  smk_methods: ['SUPER_ADMIN'],
  smk_impartiality: ['SUPER_ADMIN'],
  smk_suppliers: ['SUPER_ADMIN'],
  smk_subcontractors: ['SUPER_ADMIN'],
  smk_environment: ['SUPER_ADMIN', 'MANAGER'],
  smk_acknowledgments: ['SUPER_ADMIN'],
  smk_reviews: ['SUPER_ADMIN'],
  smk_risks: ['SUPER_ADMIN'],
  smk_objectives: ['SUPER_ADMIN'],
  smk_improvements: ['SUPER_ADMIN', 'MANAGER'],
  smk_retention: ['SUPER_ADMIN'],

  // Xodim (STAFF) faqat shu uchta modulga kiradi; boshqa hamma joyda yo'q.
  tasks: ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'],
  notifications: ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'],
  profile: ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'],
  // Fayl yuklash: kontent modullari va vazifa fayllari uchun.
  uploads: ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'],
  // Dashboard'dagi umumiy statistika va "oxirgi faoliyat" (STAFF'ga yo'q).
  dashboard: ['SUPER_ADMIN', 'MANAGER', 'EDITOR'],
  // Sarlavhadagi murojaat/ariza xulosasi.
  inbox: ['SUPER_ADMIN', 'MANAGER'],
  // Ichki chat: hamma rollar; xonalarga kirish a'zolik bo'yicha tekshiriladi.
  chat: ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'],
};

// Deny by default: a module missing from MODULE_ACCESS is closed to everyone.
function requireModule(moduleName) {
  const allowed = MODULE_ACCESS[moduleName];
  if (!allowed) console.warn(`[rbac] Unknown module "${moduleName}" — access denied for all roles.`);
  return (req, res, next) => {
    if (!allowed) return res.status(403).json({ error: 'Forbidden: bu bo\'lim uchun ruxsat yo\'q.' });
    if (!req.user) return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi.' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: bu bo\'lim uchun ruxsat yo\'q.' });
    }
    next();
  };
}

module.exports = { requireModule, MODULE_ACCESS };
