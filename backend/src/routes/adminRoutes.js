const express = require('express');
const crudFactory = require('../utils/crudFactory');
const { authenticate } = require('../middleware/auth');
const { requireModule } = require('../middleware/rbac');
const { upload, verifyFileSignature } = require('../middleware/upload');
const { updateApplicationStatus, deleteApplication } = require('../controllers/applicationController');
const { updatePrice, createPrice, listPrices, deletePrice } = require('../controllers/priceAdminController');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userAdminController');
const { updateSettings } = require('../controllers/settingsAdminController');
const { getInfoPage, updateInfoPage } = require('../controllers/infoPageAdminController');
const { listSamples, createSample, getSampleByCode, getSampleHistory, performAction, attachFile, getStats, getSampleById } = require('../controllers/sampleController');
const { addTestItem, removeTestItem } = require('../controllers/tnvedAdminController');
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const { updateProfile } = require('../controllers/authController');
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
const { nextSequentialCode } = require('../utils/sequentialCode');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');

const router = express.Router();

router.use(authenticate);
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
  include: { laboratory: true },
  searchFields: ['fullName', 'position'],
  softDelete: true,
  orderBy: { order: 'asc' },
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
router.post('/users', requireModule('users'), createUser);
router.put('/users/:id', requireModule('users'), updateUser);
router.delete('/users/:id', requireModule('users'), deleteUser);

// Settings (Super Admin only)
router.put('/settings', requireModule('settings'), updateSettings);

// Site usage analytics (Cloudflare, Super Admin only)
router.get('/analytics/overview', requireModule('analytics'), getAnalyticsOverview);

// Own admin-panel profile (any authenticated admin user, self only)
router.put('/profile', updateProfile);

// Personalized dashboard (own role-relevant stats + own recent activity)
router.get('/dashboard/my-activity', getMyDashboard);
router.get('/notifications', getNotifications);

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

// SMK (Sifat Menejmenti Kompleksi, ISO/IEC 17025) — FAZA 1: muammo
// boshqaruvi. `code` har ikkalasida ham server tomonidan avtomatik
// generatsiya qilinadi (Application.applicationNumber kabi), shuning uchun
// admin formasida tahrirlanmaydi — faqat ro'yxatda ko'rinadi.
mountCrud('smk/nonconformances', 'smk_nonconformances', 'nonConformance', {
  include: { responsibleUser: true },
  searchFields: ['code', 'description'],
  orderBy: { createdAt: 'desc' },
  buildData: async (body, { isUpdate }) => {
    if (isUpdate) return body;
    return { ...body, code: await nextSequentialCode('nonConformance', 'NC') };
  },
});
mountCrud('smk/complaints', 'smk_complaints', 'complaint', {
  include: { responsibleUser: true, relatedApplication: true },
  searchFields: ['code', 'fullName', 'phone', 'description'],
  orderBy: { createdAt: 'desc' },
  buildData: async (body, { isUpdate }) => {
    if (isUpdate) return body;
    return { ...body, code: await nextSequentialCode('complaint', 'SHK') };
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