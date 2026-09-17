const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseTnVedRanges, extractCodeTokens, matchesCode } = require('../utils/tnvedRanges');

// Approximate conformity-requirement lookup for the application form: does
// this TN VED code fall under a mandatory certificate or declaration
// requirement per resolution 43? Compares at whatever precision both the
// submitted code and the regulation's range specify — see parseTnVedRanges
// for the simplifications involved.
const checkTnVedRegulation = asyncHandler(async (req, res) => {
  const digits = (req.query.code || '').toString().replace(/\D/g, '');
  if (digits.length < 4) {
    return res.json({ matches: [], hasMandatoryCert: false, hasDeclaration: false });
  }

  const regulations = await prisma.tnVedRegulation.findMany();

  const matches = regulations
    .filter((r) => parseTnVedRanges(r.tnVedRaw).some((range) => matchesCode(range, digits)))
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

// Autocomplete for the application form's TN VED field: as the user types
// digits, suggest actual codes pulled out of our own resolution-43
// reference table (rather than a free-typed, unverified code). Matches any
// code token in tnVedRaw that starts with the typed digits.
const suggestTnVedCodes = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().replace(/\D/g, '');
  if (q.length < 2) {
    return res.json({ suggestions: [] });
  }

  const regulations = await prisma.tnVedRegulation.findMany();

  const seen = new Set();
  const suggestions = [];
  for (const r of regulations) {
    for (const { display, digits } of extractCodeTokens(r.tnVedRaw)) {
      if (!digits.startsWith(q)) continue;
      const key = `${digits}|${r.item}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ code: display, item: r.item, nameUz: r.nameUz, category: r.category });
    }
  }

  suggestions.sort((a, b) => a.code.replace(/\s/g, '').length - b.code.replace(/\s/g, '').length);

  res.json({ suggestions: suggestions.slice(0, 20) });
});

module.exports = { checkTnVedRegulation, suggestTnVedCodes };
