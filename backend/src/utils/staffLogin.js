// Login generation for specialists (Staff -> User). Pure functions, so the
// dry-run and the real run produce the same logins for the same data.
//
// Rule: login = given name (transliterated to [a-z0-9]) + "@<domain>".
// When a given name is shared by several specialists (counting ones that
// already have accounts), every new one gets the surname initial:
// axror.k, axror.t; if that still collides: axror.k2, axror.k3 ...
// Existing accounts keep their logins. Order is deterministic (staff id).

const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 's', ч: 'ch', ш: 'sh',
  щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

// Apostrophes used in Uzbek Latin (o', g', ʼ): all dropped.
const APOSTROPHES = /['`ʻʼ’‘´]/g;

function transliterate(word) {
  return String(word)
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .split('')
    .map((ch) => (ch in CYRILLIC ? CYRILLIC[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]/g, '');
}

const PATRONYMIC_MARKERS = new Set(['ogli', 'ugli', 'qizi', 'kizi']);
const SURNAME_RE = /(ov|ev|yev|ova|eva|yeva|iy|ovna|evna|ovich|evich)$/;

const hasCyrillic = (s) => /[Ѐ-ӿ]/.test(s);
const hasLatin = (s) => /[A-Za-z]/.test(s);

// Splits "Familiya Ism Otasining ismi [o'g'li/qizi]" into given name and
// surname. Order: Uzbek official "Surname Given Patronymic"; when only the
// last of two words looks like a surname ("Axror Karimov"), it's reversed.
// Returns { given, surname, review } — review = reason it can't be automatic.
function splitFullName(fullName) {
  const raw = String(fullName || '').trim();
  if (hasCyrillic(raw) && hasLatin(raw)) return { review: 'Kirill va lotin aralash' };

  let parts = raw.split(/\s+/).filter(Boolean);
  // Drop a trailing patronymic marker ("o'g'li", "qizi", "ўғли").
  if (parts.length && PATRONYMIC_MARKERS.has(transliterate(parts[parts.length - 1]))) parts = parts.slice(0, -1);

  if (parts.length < 2) return { review: "Bir so'zli F.I.Sh." };
  if (parts.length > 3) return { review: "F.I.Sh. 3 qismdan ko'p" };

  const latin = parts.map(transliterate);
  let givenIdx = 1;
  let surnameIdx = 0;
  if (parts.length === 2 && !SURNAME_RE.test(latin[0]) && SURNAME_RE.test(latin[1])) {
    givenIdx = 0;
    surnameIdx = 1;
  }
  const given = latin[givenIdx];
  const surname = latin[surnameIdx];
  if (!given || given.length < 2) return { review: "Ism aniqlanmadi (bosh harf yoki qisqa)" };
  return { given, surname: surname || '' };
}

const localPart = (email) => String(email).split('@')[0];

// staff: [{ id, fullName, hasAccount }] — every active specialist, so the
// collision check also counts colleagues who already have accounts.
// takenEmails: Set of every existing User.email.
// Returns Map(staffId -> { given, email, review? }) for specialists without
// an account.
function buildLogins(staff, takenEmails, domain) {
  const sorted = [...staff].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const parsed = sorted.map((s) => ({ ...s, ...splitFullName(s.fullName) }));

  const givenCount = new Map();
  parsed.forEach((p) => {
    if (p.given) givenCount.set(p.given, (givenCount.get(p.given) || 0) + 1);
  });

  const taken = new Set([...takenEmails].map((e) => String(e).toLowerCase()));
  const result = new Map();
  parsed
    .filter((p) => !p.hasAccount)
    .forEach((p) => {
      if (!p.given) {
        result.set(p.id, { given: null, email: null, review: p.review });
        return;
      }
      const shared = givenCount.get(p.given) > 1;
      const base = shared && p.surname ? `${p.given}.${p.surname[0]}` : p.given;
      let candidate = `${base}@${domain}`;
      for (let n = 2; taken.has(candidate); n += 1) candidate = `${base}${n}@${domain}`;
      taken.add(candidate);
      result.set(p.id, { given: p.given, email: candidate });
    });
  return result;
}

module.exports = { transliterate, splitFullName, buildLogins, localPart };
