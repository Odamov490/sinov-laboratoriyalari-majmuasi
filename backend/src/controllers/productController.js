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
// plus any indicators conditional on the caller's selectedOptions, grouped
// into labeled "sub-programs" — one for the baseline set, and one per
// selected option that actually contributes indicators — rather than a
// single flat merged list. This is what makes it obvious that baseline
// indicators are present (they get their own section) instead of silently
// blending into (or seeming to drop out of) the option-specific results.
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
    include: { indicator: true, conditionOption: true },
    orderBy: { createdAt: 'asc' },
  });

  const toRow = (indicator) => ({
    nameUz: indicator.nameUz,
    nameRu: indicator.nameRu,
    nameEn: indicator.nameEn,
    standardCode: indicator.standardCode,
    method: indicator.method,
    unit: indicator.unit,
  });

  const groups = [];

  const baselineRows = assignments
    .filter((a) => !a.conditionOptionId && !a.indicator.deletedAt)
    .map((a) => toRow(a.indicator));
  if (baselineRows.length) {
    groups.push({
      labelUz: "Asosiy ko'rsatkichlar",
      labelRu: 'Основные показатели',
      labelEn: 'Baseline indicators',
      indicators: baselineRows,
    });
  }

  // One sub-program per selected option, in the order the caller selected
  // them, skipped if that option happens to carry no indicators.
  for (const optId of optionIds) {
    const optionAssignments = assignments.filter((a) => a.conditionOptionId === optId && !a.indicator.deletedAt);
    if (!optionAssignments.length) continue;
    const option = optionAssignments[0].conditionOption;
    groups.push({
      labelUz: option?.labelUz || '',
      labelRu: option?.labelRu || option?.labelUz || '',
      labelEn: option?.labelEn || option?.labelUz || '',
      indicators: optionAssignments.map((a) => toRow(a.indicator)),
    });
  }

  return { product, groups };
}

const generateTestProgram = asyncHandler(async (req, res) => {
  const { selectedOptions } = req.body;
  const result = await resolveIndicators(req.params.slug, selectedOptions);
  if (!result) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  res.json({ groups: result.groups });
});

const downloadTestProgramDocx = asyncHandler(async (req, res) => {
  const { selectedOptions } = req.body;
  const result = await resolveIndicators(req.params.slug, selectedOptions);
  if (!result) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  const { product, groups } = result;
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

  const groupTable = (group) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell("Ko'rsatkich nomi"),
            headerCell('Standart kodi'),
            headerCell('Sinov usuli'),
            headerCell("O'lchov birligi"),
          ],
        }),
        ...group.indicators.map(
          (ind) =>
            new TableRow({
              children: [bodyCell(ind.nameUz), bodyCell(ind.standardCode), bodyCell(ind.method), bodyCell(ind.unit)],
            })
        ),
      ],
    });

  // Each group ("sub-program") gets its own heading + table, one after the
  // other — a spacer paragraph separates consecutive tables since docx has
  // no native margin-between-tables option.
  const groupBlocks = groups.flatMap((group, idx) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: idx === 0 ? 0 : 300, after: 120 },
      children: [new TextRun({ text: group.labelUz, bold: true })],
    }),
    groupTable(group),
  ]);

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
          ...(groupBlocks.length
            ? groupBlocks
            : [new Paragraph({ children: [new TextRun({ text: "Ko'rsatkichlar topilmadi." })] })]),
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
