const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateApplicationNumber } = require('../utils/applicationNumber');
const { verifyFileSignature } = require('../middleware/upload');
const { notifyNewApplication, notifyApplicationStatusChange } = require('../services/notificationService');
const fs = require('fs');

const applicationSchema = z.object({
  fullName: z.string().min(2),
  organization: z.string().optional(),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal('')),
  productName: z.string().min(1),
  productType: z.string().optional(),
  laboratoryId: z.string().optional(),
  serviceId: z.string().optional(),
  testType: z.string().optional(),
  comment: z.string().optional(),
});

const createApplication = asyncHandler(async (req, res) => {
  const data = applicationSchema.parse(req.body);
  const applicationNumber = await generateApplicationNumber();

  const files = req.files || [];
  // Verify magic bytes; reject and clean up any file that doesn't match its extension.
  for (const file of files) {
    const valid = verifyFileSignature(file.path);
    if (!valid) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: `Fayl formati yaroqsiz: ${file.originalname}` });
    }
  }

  const application = await prisma.application.create({
    data: {
      ...data,
      email: data.email || null,
      applicationNumber,
      files: {
        create: files.map((f) => ({
          fileUrl: `/uploads/${f.filename}`,
          originalName: f.originalname,
          mimeType: f.mimetype,
          size: f.size,
        })),
      },
    },
    include: { files: true },
  });

  notifyNewApplication(application).catch(() => {});

  res.status(201).json({
    message: 'Arizangiz muvaffaqiyatli qabul qilindi.',
    applicationNumber: application.applicationNumber,
    application,
  });
});

const trackApplication = asyncHandler(async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { applicationNumber: req.params.applicationNumber },
    include: { service: { include: { laboratory: true } } },
  });
  if (!application) return res.status(404).json({ error: 'Ariza topilmadi.' });

  // Public tracking: expose only non-sensitive fields.
  res.json({
    applicationNumber: application.applicationNumber,
    date: application.createdAt,
    client: application.fullName,
    laboratory: application.service?.laboratory?.nameUz || null,
    service: application.service?.nameUz || null,
    status: application.status,
    statusComment: application.statusComment,
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, statusComment } = req.body;
  const application = await prisma.application.update({
    where: { id: req.params.id },
    data: { status, statusComment },
  });
  notifyApplicationStatusChange(application).catch(() => {});
  res.json(application);
});

module.exports = { createApplication, trackApplication, updateApplicationStatus };
