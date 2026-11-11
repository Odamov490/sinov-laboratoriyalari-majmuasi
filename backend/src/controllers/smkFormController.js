const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { confinedLabId } = require('../utils/crudFactory');

// SMK elektron formalari:
//  - kutubxona (SmkForm) — SUPER_ADMIN yaratadi/tahrirlaydi;
//  - laboratoriya o'ziga kerakli formalarni tanlaydi (SmkLabForm);
//  - tanlangan forma bo'yicha yozuvlar (SmkFormEntry) to'ldiriladi.
// Laboratoriyaga biriktirilgan (User.labId) SUPER_ADMIN bo'lmagan foydalanuvchi
// faqat o'z laboratoriyasi bilan ishlaydi (crudFactory bilan bir xil qoida).

const FIELD_TYPES = new Set(['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'staff', 'file']);
const MAX_FIELDS = 100;
const NOT_FOUND = { error: "Ma'lumot topilmadi." };

const bad = (res, error) => res.status(400).json({ error });
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Maydonlar ro'yxatini tekshiradi; xato bo'lsa matn qaytaradi.
function normalizeFields(raw) {
  if (!Array.isArray(raw)) return { error: "Maydonlar ro'yxati noto'g'ri." };
  if (raw.length > MAX_FIELDS) return { error: `Maydonlar soni ${MAX_FIELDS} tadan oshmasin.` };
  const keys = new Set();
  const fields = [];
  for (const f of raw) {
    const key = str(f?.key, 40);
    const label = str(f?.label, 200);
    const type = String(f?.type || '');
    if (!/^[a-z0-9_]{1,40}$/.test(key) || keys.has(key)) return { error: "Maydon kaliti noto'g'ri yoki takrorlangan." };
    if (!label) return { error: "Har bir maydonning nomi bo'lishi kerak." };
    if (!FIELD_TYPES.has(type)) return { error: "Maydon turi noto'g'ri." };
    keys.add(key);
    const field = { key, label, type, required: Boolean(f.required) };
    if (type === 'select') {
      const options = (Array.isArray(f.options) ? f.options : [])
        .map((o) => str(o, 200))
        .filter(Boolean)
        .slice(0, 100);
      if (!options.length) return { error: `"${label}" ro'yxati uchun variantlar kiriting.` };
      field.options = [...new Set(options)];
    }
    fields.push(field);
  }
  return { fields };
}

function formData(body) {
  const code = str(body.code, 40);
  const title = str(body.title, 300);
  if (!code || !title) return { error: 'Kod va nomi majburiy.' };
  const { fields, error } = normalizeFields(body.fields ?? []);
  if (error) return { error };
  const templateUrl = str(body.templateUrl, 500);
  if (templateUrl && !templateUrl.startsWith('/uploads/')) return { error: "Shablon fayli noto'g'ri." };
  return {
    data: {
      code,
      title,
      description: str(body.description, 4000) || null,
      fields,
      templateUrl: templateUrl || null,
      templateName: templateUrl ? str(body.templateName, 200) || null : null,
      order: Number.isFinite(Number(body.order)) ? Math.trunc(Number(body.order)) : 0,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    },
  };
}

const formWithCounts = (f) => ({
  ...f,
  labCount: f._count?.labs ?? 0,
  entryCount: f._count?.entries ?? 0,
  _count: undefined,
});

// --- Kutubxona ---

const listForms = asyncHandler(async (req, res) => {
  const where = req.query.active === 'true' ? { isActive: true } : {};
  const items = await prisma.smkForm.findMany({
    where,
    orderBy: [{ order: 'asc' }, { code: 'asc' }],
    include: { _count: { select: { labs: true, entries: true } } },
  });
  res.json({ items: items.map(formWithCounts) });
});

const createForm = asyncHandler(async (req, res) => {
  const { data, error } = formData(req.body || {});
  if (error) return bad(res, error);
  if (await prisma.smkForm.findUnique({ where: { code: data.code }, select: { id: true } })) {
    return res.status(409).json({ error: 'Bu kodli forma allaqachon bor.' });
  }
  const item = await prisma.smkForm.create({ data });
  res.status(201).json(item);
});

const updateForm = asyncHandler(async (req, res) => {
  const existing = await prisma.smkForm.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!existing) return res.status(404).json(NOT_FOUND);
  const { data, error } = formData(req.body || {});
  if (error) return bad(res, error);
  const clash = await prisma.smkForm.findFirst({ where: { code: data.code, NOT: { id: req.params.id } }, select: { id: true } });
  if (clash) return res.status(409).json({ error: 'Bu kodli forma allaqachon bor.' });
  const item = await prisma.smkForm.update({ where: { id: req.params.id }, data });
  res.json(item);
});

const deleteForm = asyncHandler(async (req, res) => {
  const form = await prisma.smkForm.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { entries: true } } },
  });
  if (!form) return res.status(404).json(NOT_FOUND);
  if (form._count.entries > 0) {
    return res.status(409).json({ error: "Bu formada to'ldirilgan yozuvlar bor. O'chirish o'rniga uni nofaol qiling." });
  }
  await prisma.smkForm.delete({ where: { id: form.id } });
  res.status(204).send();
});

// --- Laboratoriyalar va biriktirish ---

// Foydalanuvchi shu laboratoriya bilan ishlay oladimi.
async function labAllowed(req, labId) {
  const confined = await confinedLabId(req);
  if (confined && confined !== labId) return false;
  return Boolean(await prisma.laboratory.findFirst({ where: { id: labId, deletedAt: null }, select: { id: true } }));
}

// Kanban: laboratoriyalar va har biriga biriktirilgan formalar (yozuvlar soni bilan).
const getBoard = asyncHandler(async (req, res) => {
  const confined = await confinedLabId(req);
  const labs = await prisma.laboratory.findMany({
    where: { deletedAt: null, ...(confined ? { id: confined } : {}) },
    orderBy: [{ order: 'asc' }, { nameUz: 'asc' }],
    select: {
      id: true,
      slug: true,
      nameUz: true,
      nameRu: true,
      nameEn: true,
      smkForms: {
        where: { form: { isActive: true } },
        select: { form: { select: { id: true, code: true, title: true, order: true } } },
      },
    },
  });
  const counts = await prisma.smkFormEntry.groupBy({
    by: ['laboratoryId', 'formId'],
    where: confined ? { laboratoryId: confined } : {},
    _count: { _all: true },
  });
  const countOf = new Map(counts.map((c) => [`${c.laboratoryId}:${c.formId}`, c._count._all]));
  res.json({
    labs: labs.map(({ smkForms, ...lab }) => ({
      ...lab,
      forms: smkForms
        .map(({ form }) => ({ ...form, entryCount: countOf.get(`${lab.id}:${form.id}`) || 0 }))
        .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code, undefined, { numeric: true })),
    })),
  });
});

const setLabForms = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  if (!(await labAllowed(req, labId))) return res.status(404).json(NOT_FOUND);
  const ids = Array.isArray(req.body?.formIds) ? [...new Set(req.body.formIds.map(String))].slice(0, 500) : null;
  if (!ids) return bad(res, "Formalar ro'yxati noto'g'ri.");
  const valid = await prisma.smkForm.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (valid.length !== ids.length) return bad(res, 'Formalardan biri topilmadi.');
  await prisma.$transaction([
    prisma.smkLabForm.deleteMany({ where: { laboratoryId: labId, formId: { notIn: ids } } }),
    prisma.smkLabForm.createMany({ data: ids.map((formId) => ({ laboratoryId: labId, formId })), skipDuplicates: true }),
  ]);
  res.json({ formIds: ids });
});

// --- Yozuvlar ---

// Lab + forma (lab'ga biriktirilgan bo'lishi shart); topilmasa null.
async function loadLabForm(req, labId, formId) {
  if (!(await labAllowed(req, labId))) return null;
  const link = await prisma.smkLabForm.findUnique({
    where: { laboratoryId_formId: { laboratoryId: labId, formId } },
    include: { form: true },
  });
  return link?.form || null;
}

// Yozuv ma'lumotini forma maydonlariga moslab tozalaydi.
function normalizeEntry(form, raw) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const data = {};
  for (const f of form.fields || []) {
    let v = input[f.key];
    if (f.type === 'checkbox') v = Boolean(v);
    else if (v === undefined || v === null || v === '') v = null;
    else if (f.type === 'number') {
      const n = Number(String(v).replace(',', '.'));
      if (!Number.isFinite(n)) return { error: `"${f.label}" raqam bo'lishi kerak.` };
      v = n;
    } else if (f.type === 'date') {
      const s = String(v).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) return { error: `"${f.label}" sanasi noto'g'ri.` };
      v = s;
    } else if (f.type === 'select') {
      v = String(v);
      if (!(f.options || []).includes(v)) return { error: `"${f.label}" uchun variant noto'g'ri.` };
    } else if (f.type === 'file') {
      v = String(v).slice(0, 500);
      if (!v.startsWith('/uploads/')) return { error: `"${f.label}" fayli noto'g'ri.` };
    } else {
      v = String(v).slice(0, f.type === 'textarea' ? 20000 : 1000);
    }
    if (f.required && f.type !== 'checkbox' && (v === null || v === '')) return { error: `"${f.label}" to'ldirilishi shart.` };
    data[f.key] = v;
  }
  return { data };
}

const entryInclude = { createdBy: { select: { id: true, fullName: true } } };

const getLabForm = asyncHandler(async (req, res) => {
  const form = await loadLabForm(req, req.params.labId, req.params.formId);
  if (!form) return res.status(404).json(NOT_FOUND);
  res.json(form);
});

const listEntries = asyncHandler(async (req, res) => {
  const { labId, formId } = req.params;
  const form = await loadLabForm(req, labId, formId);
  if (!form) return res.status(404).json(NOT_FOUND);
  const take = Math.min(Math.max(Number(req.query.pageSize) || 25, 1), 500);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const where = { formId, laboratoryId: labId };
  const [items, total] = await Promise.all([
    prisma.smkFormEntry.findMany({ where, include: entryInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
    prisma.smkFormEntry.count({ where }),
  ]);
  res.json({ items, total, page, pageSize: take });
});

const createEntry = asyncHandler(async (req, res) => {
  const { labId, formId } = req.params;
  const form = await loadLabForm(req, labId, formId);
  if (!form) return res.status(404).json(NOT_FOUND);
  const { data, error } = normalizeEntry(form, req.body?.data);
  if (error) return bad(res, error);
  const item = await prisma.smkFormEntry.create({
    data: { formId, laboratoryId: labId, data, createdById: req.user.sub },
    include: entryInclude,
  });
  res.status(201).json(item);
});

// Yozuv + uning formasi, foydalanuvchiga ruxsat bo'lsa.
async function loadEntry(req) {
  const entry = await prisma.smkFormEntry.findUnique({ where: { id: req.params.id }, include: { form: true } });
  if (!entry || !(await labAllowed(req, entry.laboratoryId))) return null;
  return entry;
}

const updateEntry = asyncHandler(async (req, res) => {
  const entry = await loadEntry(req);
  if (!entry) return res.status(404).json(NOT_FOUND);
  const { data, error } = normalizeEntry(entry.form, req.body?.data);
  if (error) return bad(res, error);
  const item = await prisma.smkFormEntry.update({ where: { id: entry.id }, data: { data }, include: entryInclude });
  res.json(item);
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await loadEntry(req);
  if (!entry) return res.status(404).json(NOT_FOUND);
  await prisma.smkFormEntry.delete({ where: { id: entry.id } });
  res.status(204).send();
});

// "Xodim" maydoni uchun faol foydalanuvchilar ro'yxati (faqat ism).
const staffOptions = asyncHandler(async (req, res) => {
  const confined = await confinedLabId(req);
  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null, ...(confined ? { labId: confined } : {}) },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
    take: 1000,
  });
  res.json({ items: users });
});

module.exports = {
  listForms,
  createForm,
  updateForm,
  deleteForm,
  getBoard,
  setLabForms,
  getLabForm,
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  staffOptions,
  normalizeFields,
  normalizeEntry,
};
