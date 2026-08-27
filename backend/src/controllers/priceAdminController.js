const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// Admin never deletes historical prices (per spec: "Admin eski narxlarni o'chirmasin").
// Updating a price snapshots the previous value into PriceHistory first.
const updatePrice = asyncHandler(async (req, res) => {
  const { amount, currency, effectiveFrom } = req.body;

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

  res.json(updated);
});

const createPrice = asyncHandler(async (req, res) => {
  const { serviceId, amount, currency } = req.body;
  const created = await prisma.price.create({
    data: { serviceId, amount, currency: currency || 'UZS' },
  });
  res.status(201).json(created);
});

const listPrices = asyncHandler(async (req, res) => {
  const items = await prisma.price.findMany({
    include: { service: { include: { laboratory: true } }, history: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ items, total: items.length });
});

module.exports = { updatePrice, createPrice, listPrices };
