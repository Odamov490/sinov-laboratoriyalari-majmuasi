const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const getLaboratories = asyncHandler(async (req, res) => {
  const items = await prisma.laboratory.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { order: 'asc' },
  });
  res.json(items);
});

const getLaboratoryBySlug = asyncHandler(async (req, res) => {
  const item = await prisma.laboratory.findFirst({
    where: { slug: req.params.slug, isActive: true, deletedAt: null },
    include: {
      services: { where: { isActive: true, deletedAt: null } },
      equipment: { where: { deletedAt: null } },
      staff: { where: { deletedAt: null } },
      standards: { where: { deletedAt: null } },
      gallery: true,
    },
  });
  if (!item) return res.status(404).json({ error: 'Laboratoriya topilmadi.' });
  res.json(item);
});

const getServices = asyncHandler(async (req, res) => {
  const { laboratoryId, categoryId, standardId, q, page = 1, pageSize = 20 } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = { isActive: true, deletedAt: null };
  if (laboratoryId) where.laboratoryId = laboratoryId;
  if (categoryId) where.categoryId = categoryId;
  if (standardId) where.standardId = standardId;
  if (q) {
    where.OR = [
      { nameUz: { contains: q, mode: 'insensitive' } },
      { nameRu: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: { laboratory: true, category: true, standard: true, prices: { where: { isCurrent: true } } },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);
  res.json({ items, total, page: Number(page), pageSize: take });
});

const getServiceBySlug = asyncHandler(async (req, res) => {
  const item = await prisma.service.findFirst({
    where: { slug: req.params.slug, isActive: true, deletedAt: null },
    include: { laboratory: true, category: true, standard: true, prices: { where: { isCurrent: true } } },
  });
  if (!item) return res.status(404).json({ error: 'Xizmat topilmadi.' });
  res.json(item);
});

const getPrices = asyncHandler(async (req, res) => {
  const { q, laboratoryId, page = 1, pageSize = 20 } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = { isCurrent: true, service: { deletedAt: null } };
  if (laboratoryId) where.service = { ...where.service, laboratoryId };
  if (q) {
    where.service = {
      ...where.service,
      OR: [
        { nameUz: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ],
    };
  }
  const [items, total] = await Promise.all([
    prisma.price.findMany({
      where,
      include: { service: { include: { laboratory: true, standard: true } } },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.price.count({ where }),
  ]);
  res.json({ items, total, page: Number(page), pageSize: take });
});

const getStandards = asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  const where = { deletedAt: null };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { code: { contains: q, mode: 'insensitive' } },
      { nameUz: { contains: q, mode: 'insensitive' } },
      { nameRu: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
    ];
  }
  const items = await prisma.standard.findMany({ where, include: { laboratory: true } });
  res.json(items);
});

const getNews = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 12, categoryId } = req.query;
  const take = Math.min(Number(pageSize) || 12, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = { isPublished: true, deletedAt: null };
  if (categoryId) where.categoryId = categoryId;
  const [items, total] = await Promise.all([
    prisma.news.findMany({ where, include: { category: true }, orderBy: { publishedAt: 'desc' }, skip, take }),
    prisma.news.count({ where }),
  ]);
  res.json({ items, total, page: Number(page), pageSize: take });
});

const getNewsBySlug = asyncHandler(async (req, res) => {
  const item = await prisma.news.findFirst({
    where: { slug: req.params.slug, isPublished: true, deletedAt: null },
    include: { category: true },
  });
  if (!item) return res.status(404).json({ error: 'Yangilik topilmadi.' });
  res.json(item);
});

const getDocuments = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const where = { deletedAt: null };
  if (categoryId) where.categoryId = categoryId;
  const items = await prisma.document.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' } });
  res.json(items);
});

const getStaff = asyncHandler(async (req, res) => {
  const { laboratoryId } = req.query;
  const where = { deletedAt: null };
  if (laboratoryId) where.laboratoryId = laboratoryId;
  const items = await prisma.staff.findMany({ where, include: { laboratory: true }, orderBy: { order: 'asc' } });
  res.json(items);
});

const getEquipment = asyncHandler(async (req, res) => {
  const { laboratoryId } = req.query;
  const where = { deletedAt: null };
  if (laboratoryId) where.laboratoryId = laboratoryId;
  const items = await prisma.equipment.findMany({ where, include: { laboratory: true } });
  res.json(items);
});

const getEquipmentBySlug = asyncHandler(async (req, res) => {
  const item = await prisma.equipment.findFirst({ where: { slug: req.params.slug, deletedAt: null }, include: { laboratory: true } });
  if (!item) return res.status(404).json({ error: 'Uskuna topilmadi.' });
  res.json(item);
});

const getGallery = asyncHandler(async (req, res) => {
  const { categoryId, laboratoryId } = req.query;
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (laboratoryId) where.laboratoryId = laboratoryId;
  const items = await prisma.gallery.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' } });
  res.json(items);
});

const getFaq = asyncHandler(async (req, res) => {
  const items = await prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  res.json(items);
});

const getAccreditation = asyncHandler(async (req, res) => {
  const item = await prisma.accreditation.findFirst({ orderBy: { updatedAt: 'desc' } });
  res.json(item || null);
});

const getSettings = asyncHandler(async (req, res) => {
  const items = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(items.map((i) => [i.key, i.value]));
  res.json(map);
});

const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ laboratories: [], services: [], standards: [], news: [], documents: [], equipment: [] });

  const like = (field) => ({ [field]: { contains: q, mode: 'insensitive' } });

  const [laboratories, services, standards, news, documents, equipment] = await Promise.all([
    prisma.laboratory.findMany({ where: { deletedAt: null, OR: [like('nameUz'), like('nameRu'), like('nameEn')] }, take: 5 }),
    prisma.service.findMany({ where: { deletedAt: null, OR: [like('nameUz'), like('nameRu'), like('nameEn')] }, take: 5 }),
    prisma.standard.findMany({ where: { deletedAt: null, OR: [like('code'), like('nameUz'), like('nameRu'), like('nameEn')] }, take: 5 }),
    prisma.news.findMany({ where: { deletedAt: null, isPublished: true, OR: [like('titleUz'), like('titleRu'), like('titleEn')] }, take: 5 }),
    prisma.document.findMany({ where: { deletedAt: null, OR: [like('titleUz'), like('titleRu'), like('titleEn')] }, take: 5 }),
    prisma.equipment.findMany({ where: { deletedAt: null, OR: [like('name')] }, take: 5 }),
  ]);

  res.json({ laboratories, services, standards, news, documents, equipment });
});

module.exports = {
  getLaboratories,
  getLaboratoryBySlug,
  getServices,
  getServiceBySlug,
  getPrices,
  getStandards,
  getNews,
  getNewsBySlug,
  getDocuments,
  getStaff,
  getEquipment,
  getEquipmentBySlug,
  getGallery,
  getFaq,
  getAccreditation,
  getSettings,
  globalSearch,
};
