const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseTnVedRanges, extractCodeTokens, matchesCode } = require('../utils/tnvedRanges');

// TIF TN 2017->2022 code-version lookup (Cabinet of Ministers resolution
// No. 733, 2022-12-31, Annex 1) — unrelated to the cert/declaration
// requirement above. That source only lists codes whose numbering changed
// in the 2022 revision, so a code found in neither table isn't reported as
// "not found" — it's treated as unchanged between the two revisions.
async function lookupCodeVersion(digits) {
  if (digits.length < 4) return null;

  const prefixes = [];
  for (let len = digits.length; len >= 4; len--) prefixes.push(digits.slice(0, len));

  const [currentRows, conversionRows] = await Promise.all([
    prisma.tnVedCurrentCode.findMany({ where: { digits: { in: prefixes } } }),
    prisma.tnVedCodeConversion.findMany({ where: { oldDigits: { in: prefixes } } }),
  ]);

  // Walk prefixes longest-first so the more specific match wins regardless
  // of which table it's in — an exact 10-digit "this old code was split"
  // conversion entry is more relevant than a 6-digit "current" heading-
  // group row that happens to share its first 6 digits.
  for (const p of prefixes) {
    const currentMatch = currentRows.find((r) => r.digits === p);
    const conversionMatch = conversionRows.find((r) => r.oldDigits === p);
    if (currentMatch) {
      return { status: 'current', digits: currentMatch.digits, display: currentMatch.display, nameUz: currentMatch.nameUz };
    }
    if (conversionMatch) {
      return { status: 'converted', oldDisplay: conversionMatch.oldDisplay, newCodes: conversionMatch.newCodes };
    }
  }
  return { status: 'unchanged' };
}

// Approximate conformity-requirement lookup for the application form: does
// this TN VED code fall under a mandatory certificate or declaration
// requirement per resolution 43? Compares at whatever precision both the
// submitted code and the regulation's range specify, and honors the
// "... дан ташқари" (except ...) exclusions carved out of some bands — see
// parseTnVedRanges for the simplifications involved.
const checkTnVedRegulation = asyncHandler(async (req, res) => {
  const digits = (req.query.code || '').toString().replace(/\D/g, '');
  if (digits.length < 4) {
    return res.json({ matches: [], hasMandatoryCert: false, hasDeclaration: false, codeVersion: null });
  }

  const regulations = await prisma.tnVedRegulation.findMany();

  const matches = [];
  for (const r of regulations) {
    const matchedRanges = parseTnVedRanges(r.tnVedRaw).filter((range) => matchesCode(range, digits));
    if (matchedRanges.length === 0) continue;

    // A qualitative exclusion (e.g. "except civil aviation") can't be
    // confirmed or ruled out from the code alone, so surface it as a
    // caveat on the match rather than silently ignoring it.
    const qualitativeExceptions = [...new Set(matchedRanges.flatMap((range) => range.qualitativeExceptions))];

    matches.push({
      item: r.item,
      nameUz: r.nameUz,
      tnVedRaw: r.tnVedRaw,
      category: r.category,
      decision: r.decision,
      qualitativeExceptions: qualitativeExceptions.length ? qualitativeExceptions : undefined,
    });
  }

  const codeVersion = await lookupCodeVersion(digits);

  res.json({
    matches,
    hasMandatoryCert: matches.some((m) => m.category === 'SERTIFIKAT'),
    hasDeclaration: matches.some((m) => m.category === 'DEKLARATSIYA'),
    codeVersion,
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
