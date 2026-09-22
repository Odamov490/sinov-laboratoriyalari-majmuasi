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
    orderBy: { order: 'asc' },
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

  // The final result is the deduped UNION of baseline + every selected
  // option's indicators: if the same indicator was (mistakenly) attached
  // under more than one selected option, it must still appear only once
  // overall — `seen` is shared across baseline and every option group
  // below, so whichever group hits an indicator first "keeps" it and every
  // later duplicate is silently dropped.
  const seen = new Set();

  const baselineRows = [];
  for (const a of assignments) {
    if (a.conditionOptionId || a.indicator.deletedAt || seen.has(a.indicatorId)) continue;
    seen.add(a.indicatorId);
    baselineRows.push(toRow(a.indicator));
  }
  if (baselineRows.length) {
    groups.push({
      labelUz: "Asosiy ko'rsatkichlar",
      labelRu: 'Основные показатели',
      labelEn: 'Baseline indicators',
      indicators: baselineRows,
    });
  }

  // One sub-program per selected option, in the order the caller selected
  // them, skipped if that option contributes no new (non-duplicate)
  // indicators.
  for (const optId of optionIds) {
    const rows = [];
    let option = null;
    for (const a of assignments) {
      if (a.conditionOptionId !== optId || a.indicator.deletedAt) continue;
      option = option || a.conditionOption;
      if (seen.has(a.indicatorId)) continue;
      seen.add(a.indicatorId);
      rows.push(toRow(a.indicator));
    }
    if (!rows.length) continue;
    groups.push({
      labelUz: option?.labelUz || '',
      labelRu: option?.labelRu || option?.labelUz || '',
      labelEn: option?.labelEn || option?.labelUz || '',
      indicators: rows,
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
  const { product, groups } = result;
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

  const groupTable = (group) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: DOCX_COLUMNS.map((c) => headerCell(c.label, c.width)),
        }),
        ...group.indicators.map(
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

  // Each group ("sub-program") gets a numbered heading (with a bottom
  // border as a section divider) followed by its own table.
  const groupBlocks = groups.flatMap((group, idx) => [
    new Paragraph({
      spacing: { before: idx === 0 ? 0 : 360, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_COLOR, space: 4 } },
      children: [new TextRun({ text: `${idx + 1}. ${group.labelUz}`, bold: true, size: 26, color: ACCENT_COLOR })],
    }),
    groupTable(group),
  ]);

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
