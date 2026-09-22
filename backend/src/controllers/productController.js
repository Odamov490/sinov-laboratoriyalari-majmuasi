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
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  Footer,
  PageNumber,
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
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  res.json(product);
});

// Shared by /generate and /download-docx: resolves the baseline indicators
// plus any indicators conditional on the caller's selectedOptions into one
// single deduped list — the UNION of baseline + every selected option's
// indicators, each indicator appearing at most once even if it was
// (mistakenly) attached under more than one selected option.
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
    orderBy: { order: 'asc' },
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

// Fixed column layout for the indicator table — widths as % of the table,
// a leading "№" numbering column (standard for official Uzbek documents),
// and per-column text alignment.
const DOCX_COLUMNS = [
  { label: '№', width: 6, align: AlignmentType.CENTER },
  { label: "Ko'rsatkich nomi", width: 38, align: AlignmentType.LEFT },
  { label: 'Standart kodi', width: 24, align: AlignmentType.LEFT },
  { label: 'Sinov usuli', width: 22, align: AlignmentType.LEFT },
  { label: "O'lchov birligi", width: 10, align: AlignmentType.CENTER },
];

const ACCENT_COLOR = '1F4E78';

const downloadTestProgramDocx = asyncHandler(async (req, res) => {
  const { selectedOptions } = req.body;
  const result = await resolveIndicators(req.params.slug, selectedOptions);
  if (!result) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  const { product, indicators } = result;
  const laboratory = product.laboratoryId
    ? await prisma.laboratory.findUnique({ where: { id: product.laboratoryId } })
    : null;

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const headerCell = (text, width) =>
    new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      shading: { fill: 'DCE6F1' },
      verticalAlign: VerticalAlign.CENTER,
      borders: cellBorders,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true })],
        }),
      ],
    });

  const bodyCell = (text, width, align) =>
    new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: cellBorders,
      children: [new Paragraph({ alignment: align, children: [new TextRun({ text: text || '-' })] })],
    });

  const indicatorsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: DOCX_COLUMNS.map((c) => headerCell(c.label, c.width)),
      }),
      ...indicators.map(
        (ind, idx) =>
          new TableRow({
            children: [
              bodyCell(String(idx + 1), DOCX_COLUMNS[0].width, DOCX_COLUMNS[0].align),
              bodyCell(ind.nameUz, DOCX_COLUMNS[1].width, DOCX_COLUMNS[1].align),
              bodyCell(ind.standardCode, DOCX_COLUMNS[2].width, DOCX_COLUMNS[2].align),
              bodyCell(ind.method, DOCX_COLUMNS[3].width, DOCX_COLUMNS[3].align),
              bodyCell(ind.unit, DOCX_COLUMNS[4].width, DOCX_COLUMNS[4].align),
            ],
          })
      ),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1701, right: 850 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun({ text: ' / ' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: 'SINOV DASTURI', bold: true, size: 32, color: ACCENT_COLOR })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [new TextRun({ text: product.nameUz, bold: true, size: 28 })],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Laboratoriya: ', bold: true }),
              new TextRun({ text: laboratory ? laboratory.nameUz : '-' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 360 },
            children: [
              new TextRun({ text: 'Sana: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('uz-UZ') }),
            ],
          }),
          ...(indicators.length
            ? [indicatorsTable]
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
