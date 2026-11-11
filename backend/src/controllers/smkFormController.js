const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { confinedLabId } = require('../utils/crudFactory');

// SMK elektron formalari:
//  - kutubxona (SmkForm) — SUPER_ADMIN yaratadi/tahrirlaydi;
//  - laboratoriya o'ziga kerakli formalarni tanlaydi (SmkLabForm);
//  - tanlangan forma bo'yicha yozuvlar (SmkFormEntry) to'ldiriladi.
// Laboratoriyaga biriktirilgan (User.labId) SUPER_ADMIN bo'lmagan foydalanuvchi
// faqat o'z laboratoriyasi bilan ishlaydi (crudFactory bilan bir xil qoida).

const FIELD_TYPES = new Set(['text', 'textarea', 'number', 'money', 'date', 'select', 'checkbox', 'staff']);
// Yig'indi hisoblanadigan (raqamli) ustun turlari: son va pul.
const NUMERIC_TYPES = new Set(['number', 'money']);
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

// Hujjat shapkasi: tashkilot qatorlari (markazda), o'ngdagi rekvizitlar
// (Shakl kodi, Versiya, ...), matn bloklari, sahifa yo'nalishi. Logo hammasida bir xil (frontend).
const BLOCK_ALIGNS = new Set(['left', 'center', 'right', 'justify']);

function normalizeHeader(raw) {
  const h = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const orgLines = (Array.isArray(h.orgLines) ? h.orgLines : []).map((l) => str(l, 300)).filter(Boolean).slice(0, 6);
  const meta = (Array.isArray(h.meta) ? h.meta : [])
    .map((m) => ({ label: str(m?.label, 100), value: str(m?.value, 200) }))
    .filter((m) => m.label)
    .slice(0, 8);
  // Matn bloklari (shapkadan keyin yoki jadvaldan keyin): «УТВЕРЖДАЮ», sarlavha,
  // akt matni, imzolar va h.k.
  const blocks = (Array.isArray(h.blocks) ? h.blocks : [])
    .map((b) => ({
      text: typeof b?.text === 'string' ? b.text.replace(/\r\n?/g, '\n').replace(/\s+$/, '').slice(0, 4000) : '',
      align: BLOCK_ALIGNS.has(b?.align) ? b.align : 'left',
      bold: Boolean(b?.bold),
      size: b?.size === 'large' ? 'large' : 'normal',
      indent: Boolean(b?.indent),
      position: b?.position === 'after' ? 'after' : 'before',
    }))
    .filter((b) => b.text.trim())
    .slice(0, 20);
  // Yakuniy qatorlar ("Итого"): birinchi `labelSpan` ustun birlashtirilib matn
  // yoziladi, `sums` dagi raqamli ustunlarda yig'indi avtomatik hisoblanadi.
  const footer = (Array.isArray(h.footer) ? h.footer : [])
    .map((r) => ({
      label: str(r?.label, 200),
      labelSpan: Math.min(101, Math.max(1, Math.trunc(Number(r?.labelSpan)) || 1)),
      sums: [...new Set((Array.isArray(r?.sums) ? r.sums : []).map((k) => String(k)).filter((k) => /^[a-z0-9_]{1,40}$/.test(k)))].slice(0, 100),
    }))
    .slice(0, 5);
  return { orgLines, meta, blocks, footer, orientation: h.orientation === 'portrait' ? 'portrait' : 'landscape' };
}

function formData(body) {
  const code = str(body.code, 40);
  const title = str(body.title, 300);
  if (!code || !title) return { error: 'Kod va nomi majburiy.' };
  const { fields, error } = normalizeFields(body.fields ?? []);
  if (error) return { error };
  return {
    data: {
      code,
      title,
      description: str(body.description, 4000) || null,
      fields,
      header: normalizeHeader(body.header),
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

// Forma har doim o'chiriladi: uning barcha yozuvlari (hamma laboratoriyalarda)
// ham birga o'chadi; laboratoriyalarga biriktirish — cascade. Frontend oldin
// yozuvlar sonini ko'rsatib tasdiq so'raydi.
const deleteForm = asyncHandler(async (req, res) => {
  const form = await prisma.smkForm.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!form) return res.status(404).json(NOT_FOUND);
  await prisma.$transaction([
    prisma.smkFormEntry.deleteMany({ where: { formId: form.id } }),
    prisma.smkForm.delete({ where: { id: form.id } }),
  ]);
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
    else if (NUMERIC_TYPES.has(f.type)) {
      // "1 250 000,50" kabi yozuvlar ham qabul qilinadi (bo'shliqlar olib tashlanadi).
      const n = Number(String(v).replace(/[\s\u00a0]/g, '').replace(',', '.'));
      if (!Number.isFinite(n)) return { error: `"${f.label}" raqam bo'lishi kerak.` };
      v = f.type === 'money' ? Math.round(n * 100) / 100 : n;
    } else if (f.type === 'date') {
      const s = String(v).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) return { error: `"${f.label}" sanasi noto'g'ri.` };
      v = s;
    } else if (f.type === 'select') {
      v = String(v);
      if (!(f.options || []).includes(v)) return { error: `"${f.label}" uchun variant noto'g'ri.` };
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
    // Jurnal tartibi: eng eskisi birinchi (1, 2, 3 …) — Word/PDF bilan bir xil.
    prisma.smkFormEntry.findMany({ where, include: entryInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (page - 1) * take, take }),
    prisma.smkFormEntry.count({ where }),
  ]);
  // Raqamli ustunlar yig'indisi (barcha qatorlar bo'yicha) — "Итого" qatori uchun.
  const numKeys = (form.fields || []).filter((f) => NUMERIC_TYPES.has(f.type)).map((f) => f.key);
  const totals = {};
  if (numKeys.length && total) {
    const all = await prisma.smkFormEntry.findMany({ where, select: { data: true } });
    for (const k of numKeys) {
      let sum = 0;
      let any = false;
      for (const e of all) {
        const v = e.data?.[k];
        if (typeof v === 'number' && Number.isFinite(v)) {
          sum += v;
          any = true;
        }
      }
      totals[k] = any ? Number(sum.toFixed(6)) : null;
    }
  }
  res.json({ items, total, page, pageSize: take, totals });
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
