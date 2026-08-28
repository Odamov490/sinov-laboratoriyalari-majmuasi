const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

function slugify(text) {
  const base = text
    .toLowerCase()
    .replace(/[ʻ'’‘]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'xizmat';
  return `${base}-${Date.now().toString().slice(-5)}`;
}

// Simple one-step price creation: the admin just types a name, picks a
// laboratory, and enters a price — the underlying Service record is
// created automatically. No need to visit "Xizmatlar" first.
const createPrice = asyncHandler(async (req, res) => {
  const { nameUz, laboratoryId, amount, currency } = req.body;

  if (!nameUz || !laboratoryId) {
    return res.status(400).json({ error: "Xizmat nomi va laboratoriya majburiy." });
  }

  const service = await prisma.service.create({
    data: {
      slug: slugify(nameUz),
      nameUz,
      nameRu: nameUz,
      nameEn: nameUz,
      laboratoryId,
      isActive: true,
    },
  });

  const price = await prisma.price.create({
    data: {
      serviceId: service.id,
      amount: amount === '' || amount === undefined || amount === null ? null : Number(amount),
      currency: currency || 'UZS',
    },
    include: { service: { include: { laboratory: true } }, history: true },
  });

  res.status(201).json(price);
});

// Admin never deletes historical prices (per spec: "Admin eski narxlarni o'chirmasin").
// Updating a price snapshots the previous value into PriceHistory first.
// Also allows renaming the service and reassigning its laboratory in the
// same request, so the whole entry can be edited from one simple form.
const updatePrice = asyncHandler(async (req, res) => {
  const { amount, currency, effectiveFrom, nameUz, laboratoryId } = req.body;

  const current = await prisma.price.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: 'Narx topilmadi.' });

  await prisma.priceHistory.create({
    data: { priceId: current.id, amount: current.amount, currency: current.currency },
  });

  const updated = await prisma.price.update({
    where: { id: current.id },
    data: {
      amount: amount ?? current.amount,
      currency: currency ?? current.currency,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : current.effectiveFrom,
    },
  });

  if (nameUz || laboratoryId) {
    await prisma.service.update({
      where: { id: current.serviceId },
      data: {
        ...(nameUz ? { nameUz, nameRu: nameUz, nameEn: nameUz } : {}),
        ...(laboratoryId ? { laboratoryId } : {}),
      },
    });
  }

  res.json(updated);
});

const listPrices = asyncHandler(async (req, res) => {
  const items = await prisma.price.findMany({
    include: { service: { include: { laboratory: true } }, history: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ items, total: items.length });
});

module.exports = { updatePrice, createPrice, listPrices };