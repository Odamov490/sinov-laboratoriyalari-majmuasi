// Parses the free-text TN VED range/list wording used in Cabinet of
// Ministers resolution 43 (e.g. "0601 — 0602", "0701, 0703, 0712
// 90 110 0, 0713", "8701 — 8706 (8701 91 500 0 ... дан ташқари)") into a
// list of ranges: [{ minDigits, maxDigits, exclusions, qualitativeExceptions },
// ...], each range's bounds kept as digit *strings* (not truncated to 4
// digits) so matchesCode() can compare at whatever precision both the range
// and the looked-up code actually specify — e.g. "9026 10 — 9026 80800 0"
// only covers subheadings 10–80 within heading 9026, so a code like
// 9026.90.00.00 (outside that sub-range) must NOT match just because it
// shares the 9026 heading.
//
// "(... дан ташқари)" clauses (e.g. "2401 — 2404 (2401 20 600 0 ... дан
// ташқари)") are parsed as exclusions from the preceding range, rather than
// being dropped: each excluded item is either a specific code/range
// (checked by matchesCode) or, when it's a qualitative description with no
// TN VED code of its own (e.g. "фуқаролик авиациясидан ташқари" — except
// civil aviation, "эҳтиёт қисмларидан ташқари" — except spare parts),
// recorded as free text on qualitativeExceptions for the caller to surface
// as a caveat (a code match can't by itself confirm or rule out a
// qualitative condition like that).
//
// Deliberate simplifications (this is an approximate match — not a legally
// authoritative parse of the resolutions):
//  - Non-exclusion parentheticals (e.g. "(фақат слайдлар учун
//    проекторлар)" — a narrowing "only ..." qualifier, not an "except ..."
//    exclusion) are dropped, same as before.
//  - When a range's two endpoints (or an exclusion's) are given at
//    different digit precisions in the source text (a transcription
//    quirk), comparison falls back to the shorter of the two.
function parseTnVedRanges(tnVedRaw) {
  if (!tnVedRaw) return [];

  const ranges = [];
  for (const rawSegment of splitTopLevel(tnVedRaw, ',')) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    const { range, orphanExclusion } = parseSegment(segment);
    if (range) {
      ranges.push(range);
    } else if (orphanExclusion && ranges.length > 0) {
      // A "(... дан ташқари)" clause that ended up as its own top-level
      // segment because the source text has a comma before the "(" (a
      // transcription quirk) — it clearly modifies the range right before
      // it, so attach it there instead of discarding it.
      const prev = ranges[ranges.length - 1];
      prev.exclusions.push(...orphanExclusion.exclusions);
      prev.qualitativeExceptions.push(...orphanExclusion.qualitativeExceptions);
    }
  }
  return ranges;
}

// Parses one top-level (comma-separated) segment into either a { range } —
// a normal "code" or "code — code" entry, optionally with its own
// exclusions — or, if the segment turns out to be nothing but a "(... дан
// ташқари)" clause with no code of its own, an { orphanExclusion }.
function parseSegment(segment) {
  const parenMatch = segment.match(/\(([^()]*)\)/);
  let mainText = segment;
  const exclusions = [];
  const qualitativeExceptions = [];

  if (parenMatch) {
    mainText = segment.replace(parenMatch[0], ' ').trim();
    const parenContent = parenMatch[1];
    if (/дан ташқари/.test(parenContent)) {
      const beforeExcept = parenContent.replace(/дан ташқари/g, '');
      for (const part of beforeExcept.split(',').map((p) => p.trim()).filter(Boolean)) {
        const dashParts = part.split(/[-–—]/);
        if (dashParts.length >= 2) {
          const left = digitsOf(dashParts[0]);
          const right = digitsOf(dashParts[dashParts.length - 1]);
          if (left !== null && right !== null) {
            exclusions.push(makeRange(left, right));
            continue;
          }
        }

        if (isNumericOnly(part)) {
          for (const code of splitGluedCodes(part)) {
            if (code.length >= 4) exclusions.push(makeRange(code, code));
          }
        } else {
          qualitativeExceptions.push(part);
        }
      }
    }
  }

  const range = parseRange(mainText);
  if (range) {
    range.exclusions = exclusions;
    range.qualitativeExceptions = qualitativeExceptions;
    return { range, orphanExclusion: null };
  }

  if (exclusions.length || qualitativeExceptions.length) {
    return { range: null, orphanExclusion: { exclusions, qualitativeExceptions } };
  }

  return { range: null, orphanExclusion: null };
}

// Parses "code" or "code — code" text (parens already stripped) into a
// { minDigits, maxDigits } range, or null if there's no usable code.
function parseRange(text) {
  const dashParts = text.split(/[-–—]/);
  if (dashParts.length >= 2) {
    const left = digitsOf(dashParts[0]);
    const right = digitsOf(dashParts[dashParts.length - 1]);
    if (left !== null && right !== null) return makeRange(left, right);
  }
  const single = digitsOf(text);
  return single !== null ? makeRange(single, single) : null;
}

// Splits text on a separator, but only at nesting depth 0 — so a comma
// *inside* a "(...)" group (e.g. a multi-code exclusion list) never breaks
// the segment it belongs to.
function splitTopLevel(text, separator) {
  const result = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === separator && depth <= 0) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function isNumericOnly(text) {
  return /^[\d\s]+$/.test(text.trim());
}

// A handful of source segments join two codes with just a space instead of
// a comma (e.g. "2403 99 900 8 2404 11 000", a transcription typo). Since
// every real TN VED code here starts with a 4-digit heading, a 4-digit
// group appearing after we've already started collecting one code is
// treated as the start of the next.
function splitGluedCodes(text) {
  const groups = text.trim().split(/\s+/).filter(Boolean);
  const codes = [];
  let current = [];
  for (const g of groups) {
    if (g.length === 4 && current.length > 0) {
      codes.push(current.join(''));
      current = [g];
    } else {
      current.push(g);
    }
  }
  if (current.length) codes.push(current.join(''));
  return codes;
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
// fall inside `range`, once its exclusions are accounted for? Compares at
// the shorter of the range's precision and the code's own precision, so a
// bare 4-digit heading query still matches broadly (not enough information
// to exclude it), while a fully-specified 8/10-digit code is checked
// against the real sub-range boundaries.
//
// An exclusion only rules a code out when the code is at least as precise
// as the exclusion itself — a short/partial query can't be confirmed to
// fall inside a narrow excluded code, so it's left matching the main range
// (cautious: better to flag a possible requirement than wrongly clear one).
function matchesCode(range, codeDigits) {
  const precision = Math.min(range.minDigits.length, codeDigits.length);
  const code = parseInt(codeDigits.slice(0, precision), 10);
  const min = parseInt(range.minDigits.slice(0, precision), 10);
  const max = parseInt(range.maxDigits.slice(0, precision), 10);
  if (code < min || code > max) return false;

  for (const excl of range.exclusions || []) {
    if (codeDigits.length < excl.minDigits.length) continue;
    const p = excl.minDigits.length;
    const c = parseInt(codeDigits.slice(0, p), 10);
    const emin = parseInt(excl.minDigits.slice(0, p), 10);
    const emax = parseInt(excl.maxDigits.slice(0, p), 10);
    if (c >= emin && c <= emax) return false;
  }

  return true;
}

// Extracts individual TN VED code tokens out of the same free-text wording
// (for the code-suggestion autocomplete): a token is a run of space-
// separated digit groups (e.g. "8701 91 500 0"), which comma/dash list and
// range separators naturally break on since they aren't whitespace. Range
// endpoints (e.g. both sides of "2203 — 2208") surface as separate tokens
// too — an approximation, same spirit as parseTnVedRanges. Unlike
// parseTnVedRanges, this doesn't distinguish exclusions (parens are simply
// dropped) — it's only used for discoverability, not for the actual
// requirement determination.
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
