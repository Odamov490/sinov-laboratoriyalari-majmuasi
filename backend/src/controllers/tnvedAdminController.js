const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const listInquiries = asyncHandler(async (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.tnVedInquiry.findMany({
      where,
      include: { matchedCode: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.tnVedInquiry.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

const updateInquiryStatus = asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(['YANGI', 'BOGLANILDI', 'ARIZAGA_AYLANDI']) }).parse(req.body);
  const inquiry = await prisma.tnVedInquiry.update({ where: { id: req.params.id }, data: { status } });
  res.json(inquiry);
});

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

module.exports = { listInquiries, updateInquiryStatus, addTestItem, removeTestItem };
