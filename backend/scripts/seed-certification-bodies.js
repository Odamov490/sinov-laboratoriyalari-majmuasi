#!/usr/bin/env node
/*
 * Buyurtmachilar (sertifikatlashtirish idoralari) spravochnigini rasmiy
 * ro'yxatdan to'ldiradi: prisma/seed-data/certification-bodies.json (93 ta).
 *
 *  - Bazada allaqachon bor idora (jurnalda ishlatilayotgan qisqa nomi,
 *    masalan "Attest") qisqa nomi/aliaslari bo'yicha topiladi: uning nomi
 *    O'ZGARMAYDI (jurnal avvalgidek ko'rinadi), faqat to'liq rasmiy nomi
 *    (fullName) yoziladi. Dublikat yaratilmaydi.
 *  - Topilmaganlari yangi qo'shiladi: name = qisqa nom, fullName = to'liq nom.
 *  - Ro'yxatda yo'q eski idoralarga tegilmaydi. Hech narsa o'chirilmaydi.
 *  - Bir necha mos keladigan (noaniq) holatlar o'tkazib yuboriladi va ko'rsatiladi.
 *  - Qayta ishga tushirish xavfsiz (ikkinchi marta hech narsa o'zgarmaydi).
 *
 * Ishlatish (backend papkasida yoki konteyner ichida):
 *   node scripts/seed-certification-bodies.js          -> faqat ko'rsatadi
 *   node scripts/seed-certification-bodies.js --apply  -> yozadi
 */
require('dotenv').config();
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const DATA_FILE = path.join(__dirname, '..', 'prisma', 'seed-data', 'certification-bodies.json');

// Tirnoq/apostrof turlari, bo'shliqlar va registrdan qat'i nazar solishtirish.
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[‘’`ʻʼ´]/g, "'")
    .replace(/["“”«»„]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function prepare(entries) {
  const quotedCount = new Map();
  entries.forEach((e) => (e.quotedNames || []).forEach((q) => quotedCount.set(norm(q), (quotedCount.get(norm(q)) || 0) + 1)));
  const shorts = new Set();
  return entries.map((e) => {
    const short = (e.short || (e.quotedNames || []).join(' / ') || e.name).trim();
    if (shorts.has(norm(short))) throw new Error(`Qisqa nom takrorlangan: ${short}`);
    shorts.add(norm(short));
    const keys = new Set([norm(short), norm(e.name)]);
    if ((e.quotedNames || []).length > 1) keys.add(norm(e.quotedNames.join(' / ')));
    // Bitta qo'shtirnoqli nom bir necha idorada bo'lsa (masalan "Global Investment
    // Systems"), u faqat preferForExisting belgilangan idora uchun kalit bo'ladi.
    (e.quotedNames || []).forEach((q) => {
      if (quotedCount.get(norm(q)) === 1 || e.preferForExisting) keys.add(norm(q));
    });
    return { id: e.id, short, fullName: e.name.trim(), keys };
  });
}

async function plan(prisma, entries) {
  const prepared = prepare(entries);
  const existing = await prisma.certificationBody.findMany({ select: { id: true, name: true, fullName: true, aliases: true } });
  const bodyKeys = existing.map((b) => ({ body: b, keys: new Set([b.name, b.fullName, ...(b.aliases || [])].filter(Boolean).map(norm)) }));

  const byEntry = new Map();
  const byBody = new Map();
  prepared.forEach((e) => {
    const hits = bodyKeys.filter(({ keys }) => [...e.keys].some((k) => keys.has(k))).map(({ body }) => body);
    byEntry.set(e.id, hits);
    hits.forEach((b) => byBody.set(b.id, [...(byBody.get(b.id) || []), e]));
  });

  const updates = [];
  const creates = [];
  const unchanged = [];
  const conflicts = [];
  prepared.forEach((e) => {
    const hits = byEntry.get(e.id);
    if (hits.length > 1) return conflicts.push(`#${e.id} "${e.short}" bir nechta mavjud idoraga mos: ${hits.map((b) => b.name).join(', ')}`);
    if (hits.length === 1) {
      const body = hits[0];
      const others = byBody.get(body.id);
      if (others.length > 1) {
        return conflicts.push(`Mavjud "${body.name}" bir nechta ro'yxat yozuviga mos: ${others.map((o) => `#${o.id}`).join(', ')}`);
      }
      const aliases = [...(body.aliases || [])];
      if (norm(e.short) !== norm(body.name) && !aliases.some((a) => norm(a) === norm(e.short))) aliases.push(e.short);
      const data = {};
      if (body.fullName !== e.fullName) data.fullName = e.fullName;
      if (aliases.length !== (body.aliases || []).length) data.aliases = aliases;
      if (Object.keys(data).length) updates.push({ entry: e, body, data });
      else unchanged.push({ entry: e, body });
      return undefined;
    }
    creates.push(e);
    return undefined;
  });
  const untouched = existing.filter((b) => !byBody.has(b.id));
  return { updates, creates, unchanged, conflicts, untouched };
}

async function run(prisma, { apply, entries, log = console.log }) {
  const p = await plan(prisma, entries);
  log(`Ro'yxatda: ${entries.length} ta idora.`);
  log(`  Mavjudiga bog'lanadi (nomi o'zgarmaydi, to'liq nomi yoziladi): ${p.updates.length}`);
  p.updates.forEach((u) => log(`    = "${u.body.name}"  <-  #${u.entry.id}`));
  log(`  Yangi qo'shiladi: ${p.creates.length}`);
  p.creates.forEach((c) => log(`    + "${c.short}"`));
  log(`  Allaqachon to'liq (o'zgarishsiz): ${p.unchanged.length}`);
  if (p.conflicts.length) {
    log(`  NOANIQ — o'tkazib yuboriladi (qo'lda hal qiling): ${p.conflicts.length}`);
    p.conflicts.forEach((c) => log(`    ! ${c}`));
  }
  if (p.untouched.length) {
    log(`  Bazada bor, ro'yxatda yo'q (tegilmaydi): ${p.untouched.length}`);
    p.untouched.forEach((b) => log(`    · "${b.name}"`));
  }
  if (!apply) {
    log("\nSINOV REJIMI: hech narsa o'zgarmadi. Yozish uchun --apply qo'shing.");
    return { ...p, applied: false };
  }
  await prisma.$transaction(
    async (tx) => {
      for (const u of p.updates) await tx.certificationBody.update({ where: { id: u.body.id }, data: u.data });
      for (const c of p.creates) await tx.certificationBody.create({ data: { name: c.short, fullName: c.fullName, aliases: [] } });
    },
    { timeout: 60000 }
  );
  log(`\nYozildi: ${p.updates.length} ta yangilandi, ${p.creates.length} ta qo'shildi.`);
  return { ...p, applied: true };
}

module.exports = { run, plan, prepare, norm };

if (require.main === module) {
  const entries = require(DATA_FILE);
  const prisma = new PrismaClient();
  run(prisma, { apply: process.argv.includes('--apply'), entries })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Xato:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
