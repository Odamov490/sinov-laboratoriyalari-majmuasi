const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// SMK forma logosi: bo'sh (standart logo) yoki /uploads/ dagi PNG/JPG.
const FORM_LOGO_RE = /^\/uploads\/[\w.-]+\.(png|jpe?g)$/i;

// Body: { "org_name": "...", "phone": "...", ... } - upserts each key/value pair.
const updateSettings = asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body || {});
  const logo = req.body?.form_logo_url;
  if (logo !== undefined && logo !== '' && !FORM_LOGO_RE.test(String(logo))) {
    return res.status(400).json({ error: "Logo fayli noto'g'ri (PNG yoki JPG bo'lishi kerak)." });
  }
  const results = await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  res.json(Object.fromEntries(results.map((r) => [r.key, r.value])));
});

module.exports = { updateSettings };
