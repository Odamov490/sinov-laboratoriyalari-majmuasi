const express = require('express');
const crudFactory = require('../utils/crudFactory');
const { authenticate } = require('../middleware/auth');
const { requireActiveAccount } = require('../middleware/accountState');
const { requireModule } = require('../middleware/rbac');
const { upload, verifyFileSignature } = require('../middleware/upload');
const { updateApplicationStatus, deleteApplication } = require('../controllers/applicationController');
const { updatePrice, createPrice, listPrices, deletePrice } = require('../controllers/priceAdminController');
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listStaffWithoutAccount,
  createFromStaff,
  resetPassword,
} = require('../controllers/userAdminController');
const { updateSettings } = require('../controllers/settingsAdminController');
const { getInfoPage, updateInfoPage } = require('../controllers/infoPageAdminController');
const { listSamples, createSample, getSampleByCode, getSampleHistory, performAction, attachFile, getStats, getSampleById } = require('../controllers/sampleController');
const { addTestItem, removeTestItem } = require('../controllers/tnvedAdminController');
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const { getTopPages } = require('../controllers/pageViewController');
const testJournal = require('../controllers/testJournalController');
const tasks = require('../controllers/taskController');
const notifications = require('../controllers/notificationController');
const chatRoutes = require('./chatRoutes');
const { syncUserSafe } = require('../services/chat/membership');
const profile = require('../controllers/profileController');
const rateLimit = require('express-rate-limit');
const { getMyDashboard, getNotifications } = require('../controllers/dashboardController');
const {
  getProductBuilder,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
  listProductIndicators,
  addProductIndicator,
  removeProductIndicator,
  reorderProductIndicators,
} = require('../controllers/testProgramAdminController');
const smkForms = require('../controllers/smkFormController');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');

const router = express.Router();

router.use(authenticate);
router.use(requireActiveAccount);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

function mountCrud(path, moduleName, modelName, opts) {
  const handlers = crudFactory(modelName, opts);
  const guard = requireModule(moduleName);
  router.get(`/${path}`, guard, handlers.list);
  router.get(`/${path}/:id`, guard, handlers.getOne);
  router.post(`/${path}`, guard, handlers.create);
  router.put(`/${path}/:id`, guard, handlers.update);
  router.patch(`/${path}/:id`, guard, handlers.update);
  router.delete(`/${path}/:id`, guard, handlers.remove);
}

// Laboratories
mountCrud('laboratories', 'laboratories', 'laboratory', {
  searchFields: ['nameUz', 'nameRu', 'nameEn'],
  softDelete: true,
  orderBy: { order: 'asc' },
});

// Services & categories
mountCrud('services', 'services', 'service', {
  include: { laboratory: true, category: true, standard: true },
  searchFields: ['nameUz', 'nameRu', 'nameEn'],
  softDelete: true,
});
mountCrud('service-categories', 'services', 'serviceCategory', { searchFields: ['nameUz', 'nameRu', 'nameEn'] });

// Prices (custom, keeps history)
router.get('/prices', requireModule('prices'), listPrices);
router.post('/prices', requireModule('prices'), createPrice);
router.put('/prices/:id', requireModule('prices'), updatePrice);
router.patch('/prices/:id', requireModule('prices'), updatePrice);
router.delete('/prices/:id', requireModule('prices'), deletePrice);

// Standards
mountCrud('standards', 'standards', 'standard', {
  include: { laboratory: true },
  searchFields: ['code', 'nameUz', 'nameRu', 'nameEn'],
  softDelete: true,
});

// News & categories
mountCrud('news', 'news', 'news', {
  include: { category: true },
  searchFields: ['titleUz', 'titleRu', 'titleEn'],
  softDelete: true,
});
mountCrud('news-categories', 'news', 'newsCategory', { searchFields: ['nameUz', 'nameRu', 'nameEn'] });

// Documents & categories
mountCrud('documents', 'documents', 'document', {
  include: { category: true },
  searchFields: ['titleUz', 'titleRu', 'titleEn'],
  softDelete: true,
});
mountCrud('document-categories', 'documents', 'documentCategory', { searchFields: ['nameUz', 'nameRu', 'nameEn'] });

// Staff
mountCrud('staff', 'staff', 'staff', {
  // `account`: the linked login, shown on the specialist card (no secrets).
  include: {
    laboratory: true,
    account: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true, mustChangePassword: true } },
  },
  searchFields: ['fullName', 'position'],
  softDelete: true,
  orderBy: { order: 'asc' },
  // A deactivated or deleted specialist's account is deactivated too.
  // Laboratoriyasi o'zgarsa yoki nofaol bo'lsa — chat laboratoriya xonasi ham.
  afterWrite: async (id, { action, item }) => {
    if (action === 'remove' || item?.isActive === false) {
      await prisma.user.updateMany({ where: { staffId: id, isActive: true }, data: { isActive: false } });
    }
    const account = await prisma.user.findUnique({ where: { staffId: id }, select: { id: true } });
    if (!account) return;
    // Bog'langan hisob laboratoriyasi mutaxassis kartasiga ergashadi.
    if (action === 'update' && item && item.laboratoryId !== undefined) {
      await prisma.user.update({ where: { id: account.id }, data: { labId: item.laboratoryId || null } });
    }
    await syncUserSafe(account.id);
  },
  // The linked account is read-only here; managed under Foydalanuvchilar.
  buildData: (body) => {
    const data = { ...body };
    delete data.account;
    return data;
  },
});

// Equipment
mountCrud('equipment', 'equipment', 'equipment', {
  include: { laboratory: true },
  searchFields: ['name', 'manufacturer', 'model'],
  softDelete: true,
});

// Gallery & categories
mountCrud('gallery', 'gallery', 'gallery', { include: { category: true, laboratory: true }, searchFields: ['title'] });
mountCrud('gallery-categories', 'gallery', 'galleryCategory', {
  searchFields: ['nameUz', 'nameRu', 'nameEn'],
  orderBy: { nameUz: 'asc' },
});

// FAQ
mountCrud('faq', 'faq', 'fAQ', { searchFields: ['questionUz', 'questionRu', 'questionEn'], orderBy: { order: 'asc' } });

// Accreditation (single/multi record, super admin + manager)
mountCrud('accreditation', 'laboratories', 'accreditation', {});

// Contact messages (read/manage - Super Admin + Manager since it's inbound leads)
mountCrud('contact-messages', 'applications', 'contactMessage', { searchFields: ['fullName', 'email'] });

// TN VED conformity regulations (resolution 43 reference table — view/search, edit if needed)
mountCrud('tnved-reglament', 'applications', 'tnVedRegulation', {
  searchFields: ['item', 'nameUz', 'tnVedRaw'],
  orderBy: { createdAt: 'asc' },
});

// Applications
router.get(
  '/applications',
  requireModule('applications'),
  asyncHandler(async (req, res) => {
    const { status, laboratoryId, serviceId, page = 1, pageSize = 20 } = req.query;
    const take = Math.min(Number(pageSize) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const where = {};
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (laboratoryId) where.service = { laboratoryId };
    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: { service: { include: { laboratory: true } }, files: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.application.count({ where }),
    ]);
    res.json({ items, total, page: Number(page), pageSize: take });
  })
);
router.get(
  '/applications/:id',
  requireModule('applications'),
  asyncHandler(async (req, res) => {
    const item = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        service: { include: { laboratory: true } },
        files: true,
        testItems: { include: { service: true, addedByUser: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!item) return res.status(404).json({ error: "Ariza topilmadi." });
    res.json(item);
  })
);
router.patch('/applications/:id/status', requireModule('applications'), updateApplicationStatus);
router.delete('/applications/:id', requireModule('applications'), deleteApplication);
router.post('/applications/:id/test-items', requireModule('applications'), addTestItem);
router.delete('/applications/:id/test-items/:itemId', requireModule('applications'), removeTestItem);

// File upload endpoint (generic, for admin content like images/PDFs on entities)
router.post(
  '/uploads',
  requireModule('uploads'),
  upload.array('files', 5),
  asyncHandler(async (req, res) => {
    const files = req.files || [];
    for (const file of files) {
      if (!verifyFileSignature(file.path)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: `Fayl formati yaroqsiz: ${file.originalname}` });
      }
    }
    res.status(201).json({
      files: files.map((f) => ({ url: `/uploads/${f.filename}`, originalName: f.originalname })),
    });
  })
);

// Users (Super Admin only)
router.get('/users', requireModule('users'), listUsers);
// Mutaxassislardan ommaviy hisob yaratish va parolni tiklash (faqat SUPER_ADMIN;
// javobdagi vaqtinchalik parollar bir martagina ko'rsatiladi).
router.get('/users/staff-without-account', requireModule('users'), listStaffWithoutAccount);
router.post('/users/from-staff', requireModule('users'), createFromStaff);
router.post('/users/:id/reset-password', requireModule('users'), resetPassword);
router.post('/users', requireModule('users'), createUser);
router.put('/users/:id', requireModule('users'), updateUser);
router.delete('/users/:id', requireModule('users'), deleteUser);

// Settings (Super Admin only)
router.put('/settings', requireModule('settings'), updateSettings);

// Site usage analytics (Cloudflare, Super Admin only)
router.get('/analytics/overview', requireModule('analytics'), getAnalyticsOverview);
router.get('/analytics/top-pages', requireModule('analytics'), getTopPages);

// Shaxsiy kabinet: faqat authenticate (modul tekshiruvi yo'q), har doim
// req.user.sub — boshqa foydalanuvchi ID'si qabul qilinmaydi.
const avatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `avatar:${req.user.sub}`,
  message: { error: "Soatiga ko'pi bilan 10 ta rasm yuklash mumkin." },
});
router.get('/profile', profile.getProfile);
router.put('/profile', profile.updateProfile);
router.post('/profile/avatar', avatarLimiter, upload.single('avatar'), profile.uploadAvatar);
router.delete('/profile/avatar', profile.deleteAvatar);
router.put('/profile/password', profile.changePassword);
router.get('/profile/sessions', profile.listSessions);
router.post('/profile/sessions/revoke-others', profile.revokeOthers);
router.delete('/profile/sessions/:id', profile.revokeSession);
router.get('/profile/logins', profile.listLogins);
router.get('/profile/summary', profile.summary);
router.get('/profile/activity', profile.activity);
router.post('/profile/correction-request', profile.correctionRequest);

// Personalized dashboard (own role-relevant stats + own recent activity)
router.get('/dashboard/my-activity', requireModule('dashboard'), getMyDashboard);
// Murojaat/ariza xulosasi (sarlavhadagi qo'ng'iroqchada SA/MANAGER uchun).
router.get('/inbox-summary', requireModule('inbox'), getNotifications);

// Vazifalar (barcha rollar; har bir so'rovda vazifaning o'zi ham tekshiriladi —
// utils/taskPermissions.js). Aniq yo'llar /tasks/:id dan oldin turishi shart.
router.get('/tasks', requireModule('tasks'), tasks.listTasks);
router.post('/tasks', requireModule('tasks'), tasks.createTask);
router.get('/tasks/my-summary', requireModule('tasks'), tasks.mySummary);
router.get('/tasks/assignable-users', requireModule('tasks'), tasks.assignableUsers);
router.get('/tasks/:id', requireModule('tasks'), tasks.getTask);
router.put('/tasks/:id', requireModule('tasks'), tasks.updateTask);
router.patch('/tasks/:id/status', requireModule('tasks'), tasks.setStatus);
router.delete('/tasks/:id', requireModule('tasks'), tasks.deleteTask);
router.post('/tasks/:id/checklist', requireModule('tasks'), tasks.addChecklistItem);
router.patch('/tasks/:id/checklist/:itemId', requireModule('tasks'), tasks.updateChecklistItem);
router.delete('/tasks/:id/checklist/:itemId', requireModule('tasks'), tasks.removeChecklistItem);
router.post('/tasks/:id/comments', requireModule('tasks'), tasks.addComment);
router.post('/tasks/:id/attachments', requireModule('tasks'), tasks.addAttachment);
router.delete('/tasks/:id/attachments/:attId', requireModule('tasks'), tasks.removeAttachment);

// Shaxsiy bildirishnomalar (faqat o'ziniki).
router.get('/notifications', requireModule('notifications'), notifications.listNotifications);
router.post('/notifications/read-all', requireModule('notifications'), notifications.readAllNotifications);
router.post('/notifications/:id/read', requireModule('notifications'), notifications.readNotification);

// Ichki chat (xonalar, xabarlar). Ruxsat a'zolik bo'yicha — routes/chatRoutes.js.
router.use('/chat', requireModule('chat'), chatRoutes);

// Info pages (admin-editable public explainer pages, e.g. declaration vs certificate)
router.get('/info-pages/:slug', requireModule('applications'), getInfoPage);
router.put('/info-pages/:slug', requireModule('applications'), updateInfoPage);

// Test Program Builder: indicator pool + products with conditional
// question/option-driven indicator sets.
mountCrud('test-indicators', 'testPrograms', 'testIndicator', {
  include: { laboratory: true },
  searchFields: ['nameUz', 'nameRu', 'nameEn', 'standardCode', 'positionCode'],
  softDelete: true,
});
mountCrud('products', 'testPrograms', 'product', {
  include: { laboratory: true },
  searchFields: ['nameUz', 'nameRu', 'nameEn', 'slug'],
  softDelete: true,
});
router.get('/products/:id/builder', requireModule('testPrograms'), getProductBuilder);
router.post('/products/:id/questions', requireModule('testPrograms'), createQuestion);
router.put('/products/:id/questions/:questionId', requireModule('testPrograms'), updateQuestion);
router.delete('/products/:id/questions/:questionId', requireModule('testPrograms'), deleteQuestion);
router.post('/products/:id/questions/:questionId/options', requireModule('testPrograms'), createOption);
router.put(
  '/products/:productId/questions/:questionId/options/:optionId',
  requireModule('testPrograms'),
  updateOption
);
router.delete(
  '/products/:productId/questions/:questionId/options/:optionId',
  requireModule('testPrograms'),
  deleteOption
);
router.get('/products/:id/indicators', requireModule('testPrograms'), listProductIndicators);
router.post('/products/:id/indicators', requireModule('testPrograms'), addProductIndicator);
router.post('/products/:id/indicators/reorder', requireModule('testPrograms'), reorderProductIndicators);
router.delete('/products/:id/indicators/:assignmentId', requireModule('testPrograms'), removeProductIndicator);

// SMK: elektron formalar (kutubxona, laboratoriyaga biriktirish, yozuvlar).
router.get('/smk/forms', requireModule('smk_forms'), smkForms.listForms);
router.post('/smk/forms', requireModule('smk_forms_admin'), smkForms.createForm);
router.put('/smk/forms/:id', requireModule('smk_forms_admin'), smkForms.updateForm);
router.delete('/smk/forms/:id', requireModule('smk_forms_admin'), smkForms.deleteForm);
router.get('/smk/board', requireModule('smk_forms'), smkForms.getBoard);
router.get('/smk/staff-options', requireModule('smk_forms'), smkForms.staffOptions);
router.put('/smk/labs/:labId/forms', requireModule('smk_forms'), smkForms.setLabForms);
router.get('/smk/labs/:labId/forms/:formId', requireModule('smk_forms'), smkForms.getLabForm);
router.get('/smk/labs/:labId/forms/:formId/entries', requireModule('smk_forms'), smkForms.listEntries);
router.post('/smk/labs/:labId/forms/:formId/entries', requireModule('smk_forms'), smkForms.createEntry);
router.put('/smk/entries/:id', requireModule('smk_forms'), smkForms.updateEntry);
router.delete('/smk/entries/:id', requireModule('smk_forms'), smkForms.deleteEntry);

// Hisobot: sinovlar jurnali. /summary va /suggestions /:id dan oldin turishi kerak.
router.get('/test-journal/summary', requireModule('reports'), testJournal.getSummary);
router.get('/test-journal/suggestions', requireModule('reports'), testJournal.getSuggestions);
// Jadval ustunlari (tartib, ko'rinish, qo'shimcha ustunlar): o'qish — hamma,
// o'zgartirish — faqat SUPER_ADMIN.
router.get('/test-journal/layout', requireModule('reports'), testJournal.getLayout);
router.put('/test-journal/layout', requireModule('reports_admin'), testJournal.updateLayout);
router.get('/test-journal', requireModule('reports'), testJournal.listRecords);
router.get('/test-journal/:id', requireModule('reports'), testJournal.getRecord);
router.get('/test-journal/:id/history', requireModule('reports'), testJournal.getHistory);
router.post('/test-journal', requireModule('reports'), testJournal.createRecord);
// Excel jurnalidan tayyorlangan JSON'ni admin paneldan import qilish (faqat SUPER_ADMIN).
router.post('/test-journal/bulk-delete', requireModule('reports'), testJournal.bulkDeleteRecords);
router.put('/test-journal/:id', requireModule('reports'), testJournal.updateRecord);
router.delete('/test-journal/:id', requireModule('reports'), testJournal.deleteRecord);

// Hisobot spravochniklari: o'qish — jurnal filtrlari uchun hamma 'reports'
// rollariga, o'zgartirish — faqat SUPER_ADMIN.
function mountDictionary(path, modelName, opts) {
  const handlers = crudFactory(modelName, opts);
  const read = requireModule('reports');
  const write = requireModule('reports_admin');
  router.get(`/${path}`, read, handlers.list);
  router.get(`/${path}/:id`, read, handlers.getOne);
  router.post(`/${path}`, write, handlers.create);
  router.put(`/${path}/:id`, write, handlers.update);
  router.patch(`/${path}/:id`, write, handlers.update);
  router.delete(`/${path}/:id`, write, handlers.remove);
}
mountDictionary('test-product-types', 'testProductType', { searchFields: ['code', 'nameUz'], orderBy: { nameUz: 'asc' } });
mountDictionary('test-locations', 'testLocation', { searchFields: ['code', 'nameUz'], orderBy: { nameUz: 'asc' } });
// Admin panelda faqat to'liq rasmiy nomi kiritiladi. Jurnalda ko'rinadigan
// qisqa nom (name, unikal) yangi idora uchun to'liq nomdagi qo'shtirnoq ichidan
// olinadi (bo'lmasa — to'liq nomning o'zi); tahrirlashda o'zgarmaydi.
const shortBodyName = (full) => {
  const quoted = [...full.matchAll(/["“”«»„]([^"“”«»„]{2,})["“”«»„]/g)].map((m) => m[1].trim()).filter(Boolean);
  return (quoted.length ? quoted.join(' / ') : full).slice(0, 200);
};
mountDictionary('certification-bodies', 'certificationBody', {
  searchFields: ['name', 'fullName'],
  orderBy: { name: 'asc' },
  buildData: async (body, { isUpdate }) => {
    const data = {};
    if ('fullName' in body) data.fullName = String(body.fullName || '').trim() || null;
    if ('isActive' in body) data.isActive = Boolean(body.isActive);
    if ('name' in body && String(body.name || '').trim()) data.name = String(body.name).trim();
    if (!isUpdate) {
      if (!data.fullName && !data.name) {
        const err = new Error("To'liq nomini kiriting.");
        err.status = 400;
        throw err;
      }
      if (!data.name) {
        const base = shortBodyName(data.fullName);
        let name = base;
        for (let i = 2; await prisma.certificationBody.findUnique({ where: { name }, select: { id: true } }); i += 1) name = `${base} (${i})`;
        data.name = name;
      }
    }
    return data;
  },
});
// Sinov yo'nalishlari (BZ, EMM, EE, Shovqin, ...). Yozuvlar kod bo'yicha
// bog'langan: kod faqat yaratishda beriladi va keyin o'zgarmaydi; yozuvlarda
// ishlatilgan yo'nalish o'chirilmaydi (nofaol qilinadi).
const DIRECTION_CODE_RE = /^[A-Z0-9_]{1,40}$/;
router.delete(
  '/test-direction-types/:id',
  requireModule('reports_admin'),
  asyncHandler(async (req, res, next) => {
    const type = await prisma.testDirectionType.findUnique({ where: { id: req.params.id }, select: { code: true } });
    if (!type) return next();
    const [records, prices] = await Promise.all([
      prisma.testJournalRecord.count({ where: { directions: { has: type.code } } }),
      prisma.testJournalPrice.count({ where: { direction: type.code } }),
    ]);
    if (type.code === 'SHOVQIN' || records || prices) {
      return res.status(409).json({ error: "Bu yo'nalish jurnalda ishlatilgan — o'chirib bo'lmaydi. Uni nofaol qiling." });
    }
    next();
  })
);
mountDictionary('test-direction-types', 'testDirectionType', {
  searchFields: ['code', 'short', 'nameUz'],
  orderBy: [{ order: 'asc' }, { short: 'asc' }],
  buildData: (body, { isUpdate }) => {
    const data = {};
    if (!isUpdate) {
      const code = String(body.code || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
      if (!DIRECTION_CODE_RE.test(code)) {
        const err = new Error("Kod faqat lotin harflari, raqam va _ dan iborat bo'lishi kerak (masalan ISSIQLIK).");
        err.status = 400;
        throw err;
      }
      data.code = code;
    }
    ['short', 'nameUz'].forEach((f) => {
      if (f in body || !isUpdate) {
        const v = String(body[f] ?? '').trim();
        if (!v) {
          const err = new Error(f === 'short' ? "Qisqa nomi majburiy." : 'Nomi majburiy.');
          err.status = 400;
          throw err;
        }
        data[f] = v.slice(0, 120);
      }
    });
    if ('order' in body) data.order = Number.parseInt(body.order, 10) || 0;
    if ('isActive' in body) data.isActive = Boolean(body.isActive);
    return data;
  },
});

// Sample tracking (QR-based check-in/check-out between laboratories)
router.get('/samples/stats', requireModule('samples'), getStats);
router.get('/samples', requireModule('samples'), listSamples);
router.post('/samples', requireModule('samples'), createSample);
router.get('/samples/code/:code', requireModule('samples'), getSampleByCode);
router.get('/samples/:id', requireModule('samples'), getSampleById);
router.get('/samples/:id/history', requireModule('samples'), getSampleHistory);
router.post('/samples/:id/action', requireModule('samples'), performAction);
router.post('/samples/:id/attach', requireModule('samples'), attachFile);

module.exports = router;