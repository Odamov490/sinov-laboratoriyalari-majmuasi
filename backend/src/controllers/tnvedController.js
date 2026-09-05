const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseTnVedRanges } = require('../utils/tnvedRanges');

// Public search-as-you-type lookup used on the application form. Requires at
// least 2 characters so it never dumps the full table to an anonymous caller.
const searchTnVed = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ items: [] });

  const items = await prisma.tnVedCode.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { nameUz: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: { services: true, laboratory: true },
    orderBy: { code: 'asc' },
    take: 20,
  });

  res.json({ items });
});

const inquirySchema = z.object({
  tnVedCode: z.string().min(1),
  tnVedCodeId: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal('')),
});

// Fired in the background from the application form the moment contact
// details are filled in after a TN VED search — captures a lead even if the
// visitor never submits the full application.
const createTnVedInquiry = asyncHandler(async (req, res) => {
  const data = inquirySchema.parse(req.body);
  const inquiry = await prisma.tnVedInquiry.create({
    data: { ...data, email: data.email || null },
  });
  res.status(201).json(inquiry);
});

// Approximate conformity-requirement lookup for the application form: does
// this TN VED code fall under a mandatory certificate or declaration
// requirement per resolutions 502/43? Matches at the 4-digit HS heading
// level only — see parseTnVedRanges for the simplifications involved.
const checkTnVedRegulation = asyncHandler(async (req, res) => {
  const digits = (req.query.code || '').toString().replace(/\D/g, '');
  if (digits.length < 4) {
    return res.json({ matches: [], hasMandatoryCert: false, hasDeclaration: false });
  }

  const heading = parseInt(digits.slice(0, 4), 10);
  const regulations = await prisma.tnVedRegulation.findMany();

  const matches = regulations
    .filter((r) => parseTnVedRanges(r.tnVedRaw).some((range) => heading >= range.min && heading <= range.max))
    .map((r) => ({
      item: r.item,
      nameUz: r.nameUz,
      tnVedRaw: r.tnVedRaw,
      category: r.category,
      decision: r.decision,
    }));

  res.json({
    matches,
    hasMandatoryCert: matches.some((m) => m.category === 'SERTIFIKAT'),
    hasDeclaration: matches.some((m) => m.category === 'DEKLARATSIYA'),
  });
});

module.exports = { searchTnVed, createTnVedInquiry, checkTnVedRegulation };
