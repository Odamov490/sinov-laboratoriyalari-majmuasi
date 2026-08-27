const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const contactSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(3),
});

const createContactMessage = asyncHandler(async (req, res) => {
  const data = contactSchema.parse(req.body);
  const item = await prisma.contactMessage.create({ data: { ...data, email: data.email || null } });
  res.status(201).json({ message: 'Xabaringiz yuborildi.', item });
});

module.exports = { createContactMessage };
