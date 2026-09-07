const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseTnVedRanges } = require('../utils/tnvedRanges');

// Approximate conformity-requirement lookup for the application form: does
// this TN VED code fall under a mandatory certificate or declaration
// requirement per resolutions 502/43? Matches at the 4-digit HS heading
// level only — see parseTnVedRanges for the simplifications involved.
const checkTnVedRegulation = asyncHandler(async (req, res) => {
  const digits = (req.query.code || '').toString().replace(/\D/g, '');
  if (digits.length < 4) {
    return res.json({ matches: [], hasMandatoryCert: false, hasDeclaration: false });
  }

  const heading = parseInt(digits.slice(0, 4), 10);
  const regulations = await prisma.tnVedRegulation.findMany();

  const matches = regulations
    .filter((r) => parseTnVedRanges(r.tnVedRaw).some((range) => heading >= range.min && heading <= range.max))
    .map((r) => ({
      item: r.item,
      nameUz: r.nameUz,
      tnVedRaw: r.tnVedRaw,
      category: r.category,
      decision: r.decision,
    }));

  res.json({
    matches,
    hasMandatoryCert: matches.some((m) => m.category === 'SERTIFIKAT'),
    hasDeclaration: matches.some((m) => m.category === 'DEKLARATSIYA'),
  });
});

module.exports = { checkTnVedRegulation };
