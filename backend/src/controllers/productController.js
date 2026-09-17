const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  BorderStyle,
} = require('docx');

const getProducts = asyncHandler(async (req, res) => {
  const { q, laboratoryId, page = 1, pageSize = 20 } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = { isActive: true, deletedAt: null };
  if (laboratoryId) where.laboratoryId = laboratoryId;
  if (q) {
    where.OR = [
      { nameUz: { contains: q, mode: 'insensitive' } },
      { nameRu: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { laboratory: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total, page: Number(page), pageSize: take });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, isActive: true, deletedAt: null },
    include: {
      laboratory: true,
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
      // Only the baseline (always-included) indicators are sent up front —
      // conditional ones are resolved later via /generate once the visitor
      // has answered the questions.
      indicators: {
        where: { conditionOptionId: null },
        include: { indicator: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  res.json(product);
});

// Shared by /generate and /download-docx: resolves the baseline indicators
// plus any indicators conditional on the caller's selectedOptions into one
// deduped, display-ready list.
async function resolveIndicators(slug, selectedOptions) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
  });
  if (!product) return null;

  const optionIds = [...new Set((selectedOptions || []).map((s) => s.optionId).filter(Boolean))];

  const assignments = await prisma.productIndicatorAssignment.findMany({
    where: {
      productId: product.id,
      OR: [{ conditionOptionId: null }, { conditionOptionId: { in: optionIds } }],
    },
    include: { indicator: true },
    orderBy: { createdAt: 'asc' },
  });

  const seen = new Set();
  const indicators = [];
  for (const a of assignments) {
    if (a.indicator.deletedAt || seen.has(a.indicatorId)) continue;
    seen.add(a.indicatorId);
    indicators.push({
      nameUz: a.indicator.nameUz,
      nameRu: a.indicator.nameRu,
      nameEn: a.indicator.nameEn,
      standardCode: a.indicator.standardCode,
      method: a.indicator.method,
      unit: a.indicator.unit,
    });
  }
  return { product, indicators };
}

const generateTestProgram = asyncHandler(async (req, res) => {
  const { selectedOptions } = req.body;
  const result = await resolveIndicators(req.params.slug, selectedOptions);
  if (!result) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  res.json({ indicators: result.indicators });
});

const downloadTestProgramDocx = asyncHandler(async (req, res) => {
  const { selectedOptions } = req.body;
  const result = await resolveIndicators(req.params.slug, selectedOptions);
  if (!result) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  const { product, indicators } = result;
  const laboratory = product.laboratoryId
    ? await prisma.laboratory.findUnique({ where: { id: product.laboratoryId } })
    : null;

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
    left: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
    right: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  };

  const headerCell = (text) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      shading: { fill: 'F2F2F2' },
      borders: cellBorders,
      children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
    });

  const bodyCell = (text) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      children: [new Paragraph(text || '-')],
    });

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Ko'rsatkich nomi"),
        headerCell('Standart kodi'),
        headerCell('Sinov usuli'),
        headerCell("O'lchov birligi"),
      ],
    }),
    ...indicators.map(
      (ind) =>
        new TableRow({
          children: [bodyCell(ind.nameUz), bodyCell(ind.standardCode), bodyCell(ind.method), bodyCell(ind.unit)],
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `Sinov dasturi: ${product.nameUz}`, bold: true })],
          }),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: 'Laboratoriya: ', bold: true }),
              new TextRun({ text: laboratory ? laboratory.nameUz : '-' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: 'Sana: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('uz-UZ') }),
            ],
          }),
          indicators.length
            ? new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
            : new Paragraph({ children: [new TextRun({ text: "Ko'rsatkichlar topilmadi." })] }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `sinov-dasturi-${product.slug}.docx`;
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(buffer);
});

module.exports = {
  getProducts,
  getProductBySlug,
  generateTestProgram,
  downloadTestProgramDocx,
};
