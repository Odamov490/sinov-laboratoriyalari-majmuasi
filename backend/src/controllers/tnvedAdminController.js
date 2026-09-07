const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const addTestItem = asyncHandler(async (req, res) => {
  const { serviceId } = z.object({ serviceId: z.string().min(1) }).parse(req.body);
  const item = await prisma.applicationTestItem.create({
    data: { applicationId: req.params.id, serviceId, addedByUserId: req.user.sub },
    include: { service: true },
  });
  res.status(201).json(item);
});

const removeTestItem = asyncHandler(async (req, res) => {
  const result = await prisma.applicationTestItem.deleteMany({
    where: { id: req.params.itemId, applicationId: req.params.id },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Topilmadi.' });
  res.status(204).send();
});

module.exports = { addTestItem, removeTestItem };
