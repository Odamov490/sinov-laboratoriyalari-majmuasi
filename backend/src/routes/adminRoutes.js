const express = require('express');
const crudFactory = require('../utils/crudFactory');
const { authenticate } = require('../middleware/auth');
const { requireModule } = require('../middleware/rbac');
const { upload, verifyFileSignature } = require('../middleware/upload');
const { updateApplicationStatus } = require('../controllers/applicationController');
const { updatePrice, createPrice, listPrices } = require('../controllers/priceAdminController');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userAdminController');
const { updateSettings } = require('../controllers/settingsAdminController');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');

const router = express.Router();

router.use(authenticate);

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
mountCrud('gallery', 'gallery', 'gallery', { include: { category: true, laboratory: true } });
mountCrud('gallery-categories', 'gallery', 'galleryCategory', { searchFields: ['nameUz', 'nameRu', 'nameEn'] });

// FAQ
mountCrud('faq', 'faq', 'fAQ', { searchFields: ['questionUz', 'questionRu', 'questionEn'], orderBy: { order: 'asc' } });

// Accreditation (single/multi record, super admin + manager)
mountCrud('accreditation', 'laboratories', 'accreditation', {});

// Contact messages (read/manage - Super Admin + Manager since it's inbound leads)
mountCrud('contact-messages', 'applications', 'contactMessage', { searchFields: ['fullName', 'email'] });

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
      include: { service: { include: { laboratory: true } }, files: true },
    });
    if (!item) return res.status(404).json({ error: "Ariza topilmadi." });
    res.json(item);
  })
);
router.patch('/applications/:id/status', requireModule('applications'), updateApplicationStatus);

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

module.exports = router;
