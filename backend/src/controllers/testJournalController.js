const { z } = require('zod');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { buildSummary } = require('../utils/testJournalReport');

// Sinovlar jurnali (Hisobot bo'limi). Moliyaviy maydonlar — summa, shartnoma,
// to'lov — faqat SUPER_ADMIN uchun: boshqalarga javobdan olib tashlanadi,
// ular bo'yicha filtr/qidiruv/saralash ham ishlamaydi va yozishda e'tiborsiz
// qoldiriladi (frontendda yashirish yetarli emas).

const RESULTS = ['MOS', 'MOS_EMAS', 'QISMAN_MOS_EMAS', 'NAMUNA_TAQDIM_ETILMADI', 'BEKOR_QILINDI', 'KUTILMOQDA', 'KORIB_CHIQISH'];
const DIRECTIONS = ['XAVFSIZLIK', 'EMC', 'ENERGIYA', 'SHOVQIN'];
const PAYMENTS = ['TOLANGAN', 'TOLANMAGAN'];
const FINANCE_FIELDS = ['amount', 'contractNo', 'contractDate', 'paymentStatus'];
// Asl Excel matnlari ichidagi moliyaviy qismlar (raw.contract va h.k.).
const FINANCE_RAW_KEYS = ['contract', 'amount', 'payment'];

const SORT_FIELDS = {
  sampleReceivedDate: 'sampleReceivedDate',
  actDate: 'actDate',
  actNo: 'actNo',
  protocolDate: 'protocolDate',
  sampleCount: 'sampleCount',
  createdAt: 'createdAt',
  amount: 'amount',
};

const MAX_PAGE_SIZE = 500;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const canSeeFinance = (req) => req.user?.role === 'SUPER_ADMIN';

const INCLUDE = {
  productType: { select: { id: true, code: true, nameUz: true } },
  certificationBody: { select: { id: true, name: true } },
  location: { select: { id: true, code: true, nameUz: true } },
};

const dateOut = (d) => (d ? d.toISOString().slice(0, 10) : null);
const dateIn = (s) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

function serialize(record, finance) {
  const out = {
    ...record,
    actDate: dateOut(record.actDate),
    sampleReceivedDate: dateOut(record.sampleReceivedDate),
    protocolDate: dateOut(record.protocolDate),
    contractDate: dateOut(record.contractDate),
    amount: record.amount === null || record.amount === undefined ? null : Number(record.amount),
  };
  if (!finance) {
    FINANCE_FIELDS.forEach((f) => delete out[f]);
    if (out.raw && typeof out.raw === 'object') {
      out.raw = { ...out.raw };
      FINANCE_RAW_KEYS.forEach((k) => delete out.raw[k]);
    }
  }
  return out;
}

const parseDate = (value, name) => {
  if (value === undefined || value === '') return undefined;
  if (!DATE_RE.test(String(value))) {
    const err = new Error(`${name} YYYY-MM-DD formatida bo'lishi kerak.`);
    err.status = 400;
    throw err;
  }
  return dateIn(String(value));
};

// Builds the Prisma where-clause shared by the list and its totals.
function buildWhere(query, finance) {
  const where = { deletedAt: null };
  const and = [];

  if (query.year) where.journalYear = Number(query.year);
  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from || to) where.sampleReceivedDate = { ...(from && { gte: from }), ...(to && { lte: to }) };
  if (query.productTypeId) where.productTypeId = String(query.productTypeId);
  if (query.certificationBodyId) where.certificationBodyId = String(query.certificationBodyId);
  if (query.locationId) where.locationId = String(query.locationId);
  if (query.result && RESULTS.includes(query.result)) where.result = query.result;
  if (query.direction && DIRECTIONS.includes(query.direction)) where.directions = { has: query.direction };
  if (query.needsReview === '1' || query.needsReview === 'true') where.needsReview = true;
  if (query.actNo) where.actNo = String(query.actNo);
  if (finance && query.paymentStatus) {
    if (query.paymentStatus === 'none') where.paymentStatus = null;
    else if (PAYMENTS.includes(query.paymentStatus)) where.paymentStatus = query.paymentStatus;
  }

  const q = String(query.q || '').trim();
  if (q) {
    const or = [
      { actNo: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
    ];
    if (finance) or.push({ contractNo: { contains: q, mode: 'insensitive' } });
    and.push({ OR: or });
  }
  if (and.length) where.AND = and;
  return where;
}

const listRecords = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const where = buildWhere(req.query, finance);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 50, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number(req.query.page) || 1, 1);

  let sortField = SORT_FIELDS[req.query.sortBy] || 'sampleReceivedDate';
  if (sortField === 'amount' && !finance) sortField = 'sampleReceivedDate';
  const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';
  const orderBy = [{ [sortField]: { sort: sortDir, nulls: 'last' } }, { actDate: 'desc' }, { sourceRow: 'asc' }];

  const [items, total, sums] = await Promise.all([
    prisma.testJournalRecord.findMany({ where, include: INCLUDE, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.testJournalRecord.count({ where }),
    prisma.testJournalRecord.aggregate({ where, _sum: { sampleCount: true, amount: true } }),
  ]);

  // "Bu akt yana N ta qatorda bor": how many live rows share each act number.
  const actNos = [...new Set(items.map((i) => i.actNo).filter(Boolean))];
  const actCounts = actNos.length
    ? await prisma.testJournalRecord.groupBy({
        by: ['actNo'],
        where: { deletedAt: null, actNo: { in: actNos } },
        _count: { _all: true },
      })
    : [];
  const actCountMap = Object.fromEntries(actCounts.map((a) => [a.actNo, a._count._all]));

  res.json({
    items: items.map((i) => ({ ...serialize(i, finance), actRecordsCount: actCountMap[i.actNo] || 1 })),
    total,
    page,
    pageSize,
    totals: {
      records: total,
      sampleCount: sums._sum.sampleCount || 0,
      ...(finance && { amount: Number(sums._sum.amount || 0) }),
    },
  });
});

const getRecord = asyncHandler(async (req, res) => {
  const record = await prisma.testJournalRecord.findFirst({ where: { id: req.params.id, deletedAt: null }, include: INCLUDE });
  if (!record) return res.status(404).json({ error: 'Yozuv topilmadi.' });
  res.json(serialize(record, canSeeFinance(req)));
});

const optDate = z
  .string()
  .regex(DATE_RE, 'Sana YYYY-MM-DD formatida bo\'lishi kerak.')
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null));
const optText = z.string().trim().nullable().optional();
const optInt = z.number().int().min(0).nullable().optional();

const recordSchema = z.object({
  journalYear: z.number().int().min(2000).max(2100),
  productTypeId: z.string().uuid(),
  certificationBodyId: z.string().uuid().nullable().optional(),
  actNo: optText,
  actDate: optDate,
  executorName: optText,
  sampleReceivedDate: optDate,
  sampleReceivedTime: optText,
  sampleCount: optInt,
  cancelledSampleCount: z.number().int().min(0).optional(),
  weightNote: optText,
  protocolDate: optDate,
  directions: z.array(z.enum(DIRECTIONS)).optional(),
  result: z.enum(RESULTS),
  nonconformingCount: optInt,
  cancelledBy: z.enum(['ARIZACHI', 'ORGAN']).nullable().optional(),
  brand: optText,
  locationId: z.string().uuid().nullable().optional(),
  isRepeat: z.boolean().optional(),
  contractNo: optText,
  contractDate: optDate,
  amount: z.number().min(0).nullable().optional(),
  paymentStatus: z.enum(PAYMENTS).nullable().optional(),
  notes: z.array(z.string()).optional(),
  needsReview: z.boolean().optional(),
  reviewReasons: z.array(z.string()).optional(),
});

function toData(body, finance, { partial }) {
  const parsed = (partial ? recordSchema.partial() : recordSchema).parse(body);
  if (!finance) FINANCE_FIELDS.forEach((f) => delete parsed[f]);
  const data = { ...parsed };
  ['actDate', 'sampleReceivedDate', 'protocolDate', 'contractDate'].forEach((f) => {
    if (f in data) data[f] = data[f] ? dateIn(data[f]) : null;
  });
  // A reviewed record clears its reasons along with the flag.
  if (data.needsReview === false && !('reviewReasons' in data)) data.reviewReasons = [];
  return data;
}

const createRecord = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const data = toData(req.body, finance, { partial: false });
  const record = await prisma.testJournalRecord.create({ data, include: INCLUDE });
  res.status(201).json(serialize(record, finance));
});

const updateRecord = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const exists = await prisma.testJournalRecord.findFirst({ where: { id: req.params.id, deletedAt: null }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: 'Yozuv topilmadi.' });
  const data = toData(req.body, finance, { partial: true });
  const record = await prisma.testJournalRecord.update({ where: { id: req.params.id }, data, include: INCLUDE });
  res.json(serialize(record, finance));
});

const deleteRecord = asyncHandler(async (req, res) => {
  const { count } = await prisma.testJournalRecord.updateMany({
    where: { id: req.params.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (!count) return res.status(404).json({ error: 'Yozuv topilmadi.' });
  res.status(204).send();
});

// GET /admin/test-journal/summary?from=&to=&includeCancelled=0|1
// Period = report month date (sample received date, else act date), matching
// the monthly table of the source journal.
const getSummary = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const includeCancelled = req.query.includeCancelled === '1' || req.query.includeCancelled === 'true';
  const from = parseDate(req.query.from, 'from');
  const to = parseDate(req.query.to, 'to');
  const range = from || to ? { ...(from && { gte: from }), ...(to && { lte: to }) } : null;

  const where = { deletedAt: null };
  if (range) {
    where.OR = [{ sampleReceivedDate: range }, { sampleReceivedDate: null, actDate: range }];
  }

  const records = await prisma.testJournalRecord.findMany({
    where,
    select: {
      result: true,
      sampleCount: true,
      cancelledSampleCount: true,
      amount: true,
      sampleReceivedDate: true,
      actDate: true,
      productType: { select: { id: true, nameUz: true } },
      certificationBody: { select: { id: true, name: true } },
    },
  });

  const summary = buildSummary(records, includeCancelled);
  const strip = (row) => {
    if (finance) return row;
    const { amount, ...rest } = row;
    return rest;
  };

  res.json({
    range: { from: req.query.from || null, to: req.query.to || null },
    includeCancelled,
    totals: strip(summary.totals),
    byMonth: summary.byMonth.map(strip),
    byProductType: summary.byProductType.map(strip),
    byCertificationBody: summary.byCertificationBody.map(strip),
    byResult: summary.byResult.map(strip),
  });
});

module.exports = { listRecords, getRecord, createRecord, updateRecord, deleteRecord, getSummary };
