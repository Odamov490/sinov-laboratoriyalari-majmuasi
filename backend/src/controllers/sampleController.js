const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateSampleCode } = require('../utils/sampleCode');

const listSamples = asyncHandler(async (req, res) => {
  const { q, labId, status, page = 1, pageSize = 20 } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = { deletedAt: null };
  if (status) where.status = status;
  if (labId) where.OR = [{ originLabId: labId }, { currentLabId: labId }];
  if (q) {
    where.OR = [
      ...(where.OR || []),
      { code: { contains: q, mode: 'insensitive' } },
      { productName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.sample.findMany({
      where,
      include: { originLab: true, currentLab: true, application: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.sample.count({ where }),
  ]);
  res.json({ items, total, page: Number(page), pageSize: take });
});

const createSample = asyncHandler(async (req, res) => {
  const { productName, description, originLabId, dueDate, applicationId } = req.body;
  if (!productName || !originLabId) {
    return res.status(400).json({ error: 'Mahsulot nomi va laboratoriya majburiy.' });
  }
  const code = await generateSampleCode();

  const sample = await prisma.sample.create({
    data: {
      code,
      productName,
      description,
      originLabId,
      currentLabId: originLabId,
      status: 'LABORATORIYADA',
      dueDate: dueDate ? new Date(dueDate) : null,
      applicationId: applicationId || null,
      movements: {
        create: {
          toLabId: originLabId,
          action: 'REGISTRATSIYA',
          performedByUserId: req.user.sub,
          performedByName: req.user.fullName,
        },
      },
    },
    include: { originLab: true, currentLab: true, application: true },
  });

  res.status(201).json(sample);
});

const getSampleByCode = asyncHandler(async (req, res) => {
  const sample = await prisma.sample.findFirst({
    where: { code: req.params.code, deletedAt: null },
    include: {
      originLab: true,
      currentLab: true,
      movements: { include: { fromLab: true, toLab: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!sample) return res.status(404).json({ error: 'Namuna topilmadi.' });
  res.json(sample);
});

const getSampleHistory = asyncHandler(async (req, res) => {
  const movements = await prisma.sampleMovement.findMany({
    where: { sampleId: req.params.id },
    include: { fromLab: true, toLab: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(movements);
});

// Handles the three scan-triggered actions: CHIQARISH (send to another lab),
// QABUL_QILISH (confirm receipt), YAKUNLASH (close out testing).
const performAction = asyncHandler(async (req, res) => {
  const { action, toLabId, notes } = req.body;
  const sample = await prisma.sample.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!sample) return res.status(404).json({ error: 'Namuna topilmadi.' });

  if (action === 'CHIQARISH') {
    if (sample.status !== 'LABORATORIYADA') {
      return res.status(400).json({ error: 'Faqat laboratoriyada turgan namunani chiqarish mumkin.' });
    }
    if (!toLabId) return res.status(400).json({ error: 'Qabul qiluvchi laboratoriyani tanlang.' });

    await prisma.sampleMovement.create({
      data: {
        sampleId: sample.id,
        fromLabId: sample.currentLabId,
        toLabId,
        action: 'CHIQARISH',
        performedByUserId: req.user.sub,
        performedByName: req.user.fullName,
        notes,
      },
    });
    const updated = await prisma.sample.update({
      where: { id: sample.id },
      data: { status: 'TASHILMOQDA', currentLabId: null },
      include: { originLab: true, currentLab: true },
    });
    return res.json(updated);
  }

  if (action === 'QABUL_QILISH') {
    if (sample.status !== 'TASHILMOQDA') {
      return res.status(400).json({ error: 'Faqat tashilayotgan namunani qabul qilish mumkin.' });
    }
    if (!toLabId) return res.status(400).json({ error: 'Qabul qiluvchi laboratoriyani tanlang.' });

    await prisma.sampleMovement.create({
      data: {
        sampleId: sample.id,
        fromLabId: null,
        toLabId,
        action: 'QABUL_QILISH',
        performedByUserId: req.user.sub,
        performedByName: req.user.fullName,
        notes,
      },
    });
    const updated = await prisma.sample.update({
      where: { id: sample.id },
      data: { status: 'LABORATORIYADA', currentLabId: toLabId },
      include: { originLab: true, currentLab: true },
    });
    return res.json(updated);
  }

  if (action === 'YAKUNLASH') {
    if (sample.status !== 'LABORATORIYADA') {
      return res.status(400).json({ error: 'Faqat laboratoriyada turgan namunani yakunlash mumkin.' });
    }
    await prisma.sampleMovement.create({
      data: {
        sampleId: sample.id,
        fromLabId: sample.currentLabId,
        toLabId: null,
        action: 'YAKUNLASH',
        performedByUserId: req.user.sub,
        performedByName: req.user.fullName,
        notes,
      },
    });
    const updated = await prisma.sample.update({
      where: { id: sample.id },
      data: { status: 'YAKUNLANDI' },
      include: { originLab: true, currentLab: true },
    });
    return res.json(updated);
  }

  res.status(400).json({ error: "Noma'lum amal." });
});


// Attach a photo or final report/protocol file URL to a sample (uploaded
// separately via the generic /admin/uploads endpoint, then linked here).
const attachFile = asyncHandler(async (req, res) => {
  const { field, url } = req.body;
  if (!['photoUrl', 'reportUrl'].includes(field)) {
    return res.status(400).json({ error: "Noto'g'ri maydon." });
  }
  const updated = await prisma.sample.update({
    where: { id: req.params.id },
    data: { [field]: url },
    include: { originLab: true, currentLab: true, application: true },
  });
  res.json(updated);
});




module.exports = { listSamples, createSample, getSampleByCode, getSampleHistory, performAction, attachFile };