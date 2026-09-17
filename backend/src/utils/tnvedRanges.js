// Parses the free-text TN VED range/list wording used in Cabinet of
// Ministers resolution 43 (e.g. "0601 — 0602", "0701, 0703, 0712
// 90 110 0, 0713", "8701 — 8706 (8701 91 500 0 ... дан ташқари)") into a
// list of ranges: [{ minDigits, maxDigits }, ...], each as digit *strings*
// (not truncated to 4 digits) so matchesCode() can compare at whatever
// precision both the range and the looked-up code actually specify — e.g.
// "9026 10 — 9026 80800 0" only covers subheadings 10–80 within heading
// 9026, so a code like 9026.90.00.00 (outside that sub-range) must NOT
// match just because it shares the 9026 heading.
//
// Deliberate simplifications (this is an approximate match — not a legally
// authoritative parse of the resolutions):
//  - Everything inside parentheses is dropped entirely, including "... дан
//    ташқари" (except ...) exclusion clauses. So "8701 — 8706 (8701 91 500
//    0 ... дан ташқари)" is treated as the full, unexcluded 8701–8706 range.
//  - When a range's two endpoints are given at different digit precisions
//    in the source text (a transcription quirk), comparison falls back to
//    the shorter of the two.
function parseTnVedRanges(tnVedRaw) {
  if (!tnVedRaw) return [];

  const withoutParens = tnVedRaw.replace(/\([^)]*\)/g, ' ');
  const ranges = [];

  for (const segment of withoutParens.split(',')) {
    const parts = segment.split(/[-–—]/); // hyphen-minus, en dash, em dash

    if (parts.length >= 2) {
      const left = digitsOf(parts[0]);
      const right = digitsOf(parts[parts.length - 1]);
      if (left !== null && right !== null) {
        ranges.push(makeRange(left, right));
        continue;
      }
    }

    const single = digitsOf(segment);
    if (single !== null) ranges.push(makeRange(single, single));
  }

  return ranges;
}

// Extracts all digits from a text fragment, or null if there are fewer
// than 4 (not even enough for an HS heading).
function digitsOf(text) {
  const digits = (text.match(/\d/g) || []).join('');
  return digits.length < 4 ? null : digits;
}

// Builds a { minDigits, maxDigits } range from two digit strings, comparing
// (and ordering) them numerically at their shared precision — the shorter
// of the two lengths — so mismatched-precision endpoints from the source
// text still produce a sensible range.
function makeRange(a, b) {
  const precision = Math.min(a.length, b.length);
  const av = parseInt(a.slice(0, precision), 10);
  const bv = parseInt(b.slice(0, precision), 10);
  return av <= bv
    ? { minDigits: a.slice(0, precision), maxDigits: b.slice(0, precision) }
    : { minDigits: b.slice(0, precision), maxDigits: a.slice(0, precision) };
}

// Does `codeDigits` (the full digit string of the code being looked up)
// fall inside `range`? Compares at the shorter of the range's precision and
// the code's own precision, so a bare 4-digit heading query still matches
// broadly (not enough information to exclude it), while a fully-specified
// 8/10-digit code is checked against the real sub-range boundaries.
function matchesCode(range, codeDigits) {
  const precision = Math.min(range.minDigits.length, codeDigits.length);
  const code = parseInt(codeDigits.slice(0, precision), 10);
  const min = parseInt(range.minDigits.slice(0, precision), 10);
  const max = parseInt(range.maxDigits.slice(0, precision), 10);
  return code >= min && code <= max;
}

// Extracts individual TN VED code tokens out of the same free-text wording
// (for the code-suggestion autocomplete): a token is a run of space-
// separated digit groups (e.g. "8701 91 500 0"), which comma/dash list and
// range separators naturally break on since they aren't whitespace. Range
// endpoints (e.g. both sides of "2203 — 2208") surface as separate tokens
// too — an approximation, same spirit as parseTnVedRanges.
function extractCodeTokens(tnVedRaw) {
  if (!tnVedRaw) return [];
  const withoutParens = tnVedRaw.replace(/\([^)]*\)/g, ' ');
  const rawMatches = withoutParens.match(/\d+(?:\s+\d+)*/g) || [];

  const seen = new Set();
  const tokens = [];
  for (const raw of rawMatches) {
    const display = raw.trim().replace(/\s+/g, ' ');
    const digits = display.replace(/\s/g, '');
    if (digits.length < 4 || seen.has(digits)) continue;
    seen.add(digits);
    tokens.push({ display, digits });
  }
  return tokens;
}

module.exports = { parseTnVedRanges, extractCodeTokens, matchesCode };
