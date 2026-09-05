// Parses the free-text TN VED range/list wording used in Cabinet of
// Ministers resolutions 502 and 43 (e.g. "0601 — 0602", "0701, 0703, 0712
// 90 110 0, 0713", "8701 — 8706 (8701 91 500 0 ... дан ташқари)") into a
// list of 4-digit HS "heading" ranges: [{ min, max }, ...].
//
// Deliberate simplifications (this is an approximate, heading-level match —
// not a legally authoritative parse of the resolutions):
//  - Everything inside parentheses is dropped entirely, including "... дан
//    ташқари" (except ...) exclusion clauses. So "8701 — 8706 (8701 91 500
//    0 ... дан ташқари)" is treated as the full, unexcluded 8701–8706 range.
//  - Only the first 4 digits of each code (the HS heading) are used for
//    comparison; finer 6/10-digit precision present in the source text is
//    not modeled.
function parseTnVedRanges(tnVedRaw) {
  if (!tnVedRaw) return [];

  const withoutParens = tnVedRaw.replace(/\([^)]*\)/g, ' ');
  const ranges = [];

  for (const segment of withoutParens.split(',')) {
    const parts = segment.split(/[-–—]/); // hyphen-minus, en dash, em dash

    if (parts.length >= 2) {
      const left = headingOf(parts[0]);
      const right = headingOf(parts[parts.length - 1]);
      if (left !== null && right !== null) {
        ranges.push({ min: Math.min(left, right), max: Math.max(left, right) });
        continue;
      }
    }

    const single = headingOf(segment);
    if (single !== null) ranges.push({ min: single, max: single });
  }

  return ranges;
}

// Extracts the digits from a text fragment and returns the first 4 as a
// number (the HS heading), or null if there aren't at least 4 digits.
function headingOf(text) {
  const digits = (text.match(/\d/g) || []).join('');
  if (digits.length < 4) return null;
  return parseInt(digits.slice(0, 4), 10);
}

module.exports = { parseTnVedRanges };
