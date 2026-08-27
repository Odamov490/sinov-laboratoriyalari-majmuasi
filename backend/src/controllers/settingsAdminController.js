const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// Body: { "org_name": "...", "phone": "...", ... } - upserts each key/value pair.
const updateSettings = asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body || {});
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
