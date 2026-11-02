const { z } = require('zod');
const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { buildSummary } = require('../utils/testJournalReport');
const { validate, summarize, checkSummary, importToDb } = require('../services/testJournalImport');

// Sinovlar jurnali (Hisobot bo'limi). Moliyaviy maydonlar — summa, shartnoma,
// to'lov — faqat FINANCE_ROLES uchun: boshqalarga javobdan olib tashlanadi,
// ular bo'yicha filtr/qidiruv/saralash ham ishlamaydi va yozishda e'tiborsiz
// qoldiriladi (frontendda yashirish yetarli emas). Har bir qo'shish/o'zgartirish/
// o'chirish TestJournalChange'ga yoziladi (kim, qachon, nima).

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

// Jurnalni yurituvchilar summani ham kiritadi, shuning uchun MANAGER ham
// moliyaviy maydonlarni ko'radi. Cheklangan rol kerak bo'lsa — shu ro'yxatdan.
const FINANCE_ROLES = ['SUPER_ADMIN', 'MANAGER'];
const canSeeFinance = (req) => FINANCE_ROLES.includes(req.user?.role);

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
  // Journal "sheets": e.g. the Muzlatkich sheet excludes its noise-test rows,
  // which live on the separate Shovqin sheet.
  if (query.excludeDirection && DIRECTIONS.includes(query.excludeDirection)) {
    and.push({ NOT: { directions: { has: query.excludeDirection } } });
  }
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
  // Values of SUPER_ADMIN-defined extra columns, keyed by column key.
  customFields: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).nullable().optional(),
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
  // Empty extra-column values are dropped; nothing left = SQL NULL (Prisma
  // needs DbNull for a nullable Json column, plain null is rejected).
  if ('customFields' in data) {
    const kept = Object.fromEntries(Object.entries(data.customFields || {}).filter(([, v]) => v !== null && v !== ''));
    data.customFields = Object.keys(kept).length ? kept : Prisma.DbNull;
  }
  return data;
}

// Comparable form of a field value (dates/decimals), for the change log.
function comparable(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  return value;
}

// { field: { from, to } } for every field in `data` whose value changes.
// Extra columns are logged one by one as "customFields.<key>".
function diff(before, data) {
  const changes = {};
  Object.keys(data).forEach((key) => {
    if (key === 'customFields') {
      const plain = (v) => (v && v.constructor === Object ? v : {}); // Prisma.DbNull -> {}
      const prev = plain(before.customFields);
      const next = plain(data.customFields);
      new Set([...Object.keys(prev), ...Object.keys(next)]).forEach((k) => {
        const from = prev[k] ?? null;
        const to = next[k] ?? null;
        if (JSON.stringify(from) !== JSON.stringify(to)) changes[`customFields.${k}`] = { from, to };
      });
      return;
    }
    const from = comparable(before[key]);
    const to = comparable(data[key]);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  });
  return changes;
}

const logChange = (tx, recordId, req, action, changes = null) =>
  tx.testJournalChange.create({
    data: { recordId, userId: req.user?.sub || null, action, ...(changes && { changes }) },
  });

const createRecord = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const data = toData(req.body, finance, { partial: false });
  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.testJournalRecord.create({ data, include: INCLUDE });
    await logChange(tx, created.id, req, 'CREATE');
    return created;
  });
  res.status(201).json(serialize(record, finance));
});

const updateRecord = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const before = await prisma.testJournalRecord.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!before) return res.status(404).json({ error: 'Yozuv topilmadi.' });
  const data = toData(req.body, finance, { partial: true });
  const changes = diff(before, data);
  const record = await prisma.$transaction(async (tx) => {
    const updated = await tx.testJournalRecord.update({ where: { id: req.params.id }, data, include: INCLUDE });
    if (Object.keys(changes).length) await logChange(tx, updated.id, req, 'UPDATE', changes);
    return updated;
  });
  res.json(serialize(record, finance));
});

const deleteRecord = asyncHandler(async (req, res) => {
  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.testJournalRecord.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count) await logChange(tx, req.params.id, req, 'DELETE');
    return count;
  });
  if (!deleted) return res.status(404).json({ error: 'Yozuv topilmadi.' });
  res.status(204).send();
});

// GET /admin/test-journal/:id/history — newest first, with who made each change.
const getHistory = asyncHandler(async (req, res) => {
  const finance = canSeeFinance(req);
  const record = await prisma.testJournalRecord.findUnique({
    where: { id: req.params.id },
    select: { importKey: true, createdAt: true },
  });
  if (!record) return res.status(404).json({ error: 'Yozuv topilmadi.' });
  const entries = await prisma.testJournalChange.findMany({
    where: { recordId: req.params.id },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    importedFromExcel: Boolean(record.importKey),
    importedAt: record.importKey ? record.createdAt : null,
    items: entries.map((e) => {
      let { changes } = e;
      if (changes && !finance) {
        changes = { ...changes };
        FINANCE_FIELDS.forEach((f) => delete changes[f]);
      }
      return { id: e.id, action: e.action, userName: e.user?.fullName || null, createdAt: e.createdAt, changes };
    }),
  });
});

// GET /admin/test-journal/suggestions — earlier executor names and brands,
// for autocomplete in the entry form.
const getSuggestions = asyncHandler(async (req, res) => {
  const [executors, brands] = await Promise.all([
    prisma.testJournalRecord.findMany({
      where: { deletedAt: null, executorName: { not: null } },
      distinct: ['executorName'],
      select: { executorName: true },
      orderBy: { executorName: 'asc' },
      take: 1000,
    }),
    prisma.testJournalRecord.findMany({
      where: { deletedAt: null, brand: { not: null } },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
      take: 1000,
    }),
  ]);
  res.json({ executors: executors.map((e) => e.executorName), brands: brands.map((b) => b.brand) });
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
      directions: true,
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

// Journal table layout — one shared row. columns = [{ key, hidden?, custom?,
// label?, type? }]; null until a SUPER_ADMIN first saves it (the frontend
// then shows its built-in default order).
const LAYOUT_ID = 'default';
const layoutSchema = z
  .array(
    z.object({
      key: z.string().regex(/^[A-Za-z0-9_]{1,60}$/, "Ustun kaliti noto'g'ri."),
      hidden: z.boolean().optional(),
      custom: z.boolean().optional(),
      label: z.string().trim().max(120).optional(),
      type: z.enum(['text', 'number', 'date']).optional(),
    })
  )
  .max(200)
  .superRefine((cols, ctx) => {
    const seen = new Set();
    cols.forEach((c, i) => {
      if (seen.has(c.key)) ctx.addIssue({ code: 'custom', path: [i, 'key'], message: `Ustun takrorlangan: ${c.key}` });
      seen.add(c.key);
      if (c.custom && !c.label) ctx.addIssue({ code: 'custom', path: [i, 'label'], message: "Qo'shimcha ustun nomi kerak." });
    });
  });

const getLayout = asyncHandler(async (req, res) => {
  const layout = await prisma.testJournalLayout.findUnique({ where: { id: LAYOUT_ID } });
  res.json({ columns: layout?.columns || null, updatedAt: layout?.updatedAt || null });
});

const updateLayout = asyncHandler(async (req, res) => {
  const columns = layoutSchema.parse(req.body?.columns);
  const layout = await prisma.testJournalLayout.upsert({
    where: { id: LAYOUT_ID },
    create: { id: LAYOUT_ID, columns },
    update: { columns },
  });
  res.json({ columns: layout.columns, updatedAt: layout.updatedAt });
});

// POST /admin/test-journal/import[?dryRun=1] — body: the journal JSON file.
// Same checks as the CLI import (prisma/seed/importTestJournal.js); dryRun
// only validates and returns the totals, nothing is written.
const importJournal = asyncHandler(async (req, res) => {
  const data = req.body;
  const errors = validate(data);
  if (errors.length) {
    return res.status(400).json({ error: "Fayl tekshiruvdan o'tmadi.", errors: errors.slice(0, 50) });
  }
  const summary = summarize(data.records, (r) => r.sourceSheet);
  const problems = checkSummary(summary, data);
  if (problems.length) {
    return res.status(400).json({ error: 'Fayl kutilgan raqamlarga mos emas.', errors: problems, summary });
  }
  if (req.query.dryRun === '1') return res.json({ dryRun: true, summary });

  try {
    const result = await importToDb(prisma, data);
    res.json({ dryRun: false, created: result.created, skipped: result.skipped, summary: result.dbSummary, warnings: result.problems });
  } catch (err) {
    console.error('Test journal import failed:', err);
    res.status(400).json({ error: `Import bekor qilindi: ${err.message}` });
  }
});

module.exports = {
  getLayout,
  updateLayout,
  importJournal,
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  getSummary,
  getHistory,
  getSuggestions,
};
