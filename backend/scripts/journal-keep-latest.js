#!/usr/bin/env node
/*
 * Sinovlar jurnali: eng so'nggi N ta yozuvni qoldirib, qolgan hammasini o'chiradi.
 *
 * Tartib — Hisobot > Jurnal jadvalidagi "Namuna tanlash dalolatnomasi sanasi ↓"
 * bilan bir xil: actDate (yangi -> eski, bo'shlari oxirida), keyin sourceRow.
 *
 * O'chirish ilovadagi "O'chirish" tugmasi bilan bir xil: deletedAt qo'yiladi
 * (yumshoq o'chirish) va har bir yozuv uchun tarixga DELETE yoziladi. Ma'lumot
 * bazada qoladi; Excel importi (importKey bo'yicha) ularni qayta tiklamaydi.
 *
 * Ishlatish (backend papkasida yoki konteyner ichida):
 *   node scripts/journal-keep-latest.js --keep=5 --expect-acts=400605,400605,399625,399048,398028
 *     -> faqat ko'rsatadi (hech narsa o'zgarmaydi)
 *   node scripts/journal-keep-latest.js --keep=5 --expect-acts=... --apply
 *     -> haqiqatan o'chiradi
 *
 * --expect-acts: qoldiriladigan yozuvlarning akt raqamlari (tartib bilan).
 * Mos kelmasa, skript hech narsa qilmasdan to'xtaydi.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const ORDER = [{ actDate: { sort: 'desc', nulls: 'last' } }, { sourceRow: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }];

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');

async function run(prisma, { keep, expectActs, apply, log = console.log }) {
  const active = { deletedAt: null };
  const total = await prisma.testJournalRecord.count({ where: active });
  const kept = await prisma.testJournalRecord.findMany({
    where: active,
    orderBy: ORDER,
    take: keep,
    select: {
      id: true,
      actNo: true,
      actDate: true,
      executorName: true,
      productType: { select: { nameUz: true } },
      certificationBody: { select: { name: true } },
    },
  });

  log(`Faol yozuvlar: ${total}. Qoldiriladi: ${kept.length}. O'chiriladi: ${Math.max(total - kept.length, 0)}.`);
  log('Qoldiriladigan yozuvlar:');
  kept.forEach((r, i) =>
    log(`  ${i + 1}. akt ${r.actNo || '—'} | ${fmt(r.actDate)} | ${r.productType?.nameUz || '—'} | ${r.certificationBody?.name || '—'} | ${r.executorName || '—'}`)
  );

  if (expectActs) {
    const got = kept.map((r) => String(r.actNo || ''));
    if (got.length !== expectActs.length || got.some((a, i) => a !== expectActs[i])) {
      log(`\nTO'XTATILDI: kutilgan aktlar [${expectActs.join(', ')}], topilgani [${got.join(', ')}]. Hech narsa o'zgarmadi.`);
      return { ok: false, total, kept: kept.length, deleted: 0 };
    }
    log('\nAkt raqamlari kutilganiga mos.');
  }

  if (!apply) {
    log("\nSINOV REJIMI: hech narsa o'zgarmadi. O'chirish uchun --apply qo'shing.");
    return { ok: true, total, kept: kept.length, deleted: 0 };
  }

  const keepIds = kept.map((r) => r.id);
  const deleted = await prisma.$transaction(
    async (tx) => {
      const victims = await tx.testJournalRecord.findMany({
        where: { ...active, id: { notIn: keepIds } },
        select: { id: true },
      });
      const ids = victims.map((v) => v.id);
      if (!ids.length) return 0;
      const now = new Date();
      const { count } = await tx.testJournalRecord.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.testJournalChange.createMany({
        data: ids.map((recordId) => ({ recordId, userId: null, action: 'DELETE', changes: { reason: 'bulk-cleanup: keep latest' } })),
      });
      return count;
    },
    { timeout: 120000 }
  );
  log(`\nO'chirildi: ${deleted} ta yozuv. Qoldi: ${await prisma.testJournalRecord.count({ where: active })} ta.`);
  return { ok: true, total, kept: kept.length, deleted };
}

module.exports = { run };

if (require.main === module) {
  const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const keep = Number(arg('keep') || 5);
  const expectActs = arg('expect-acts') ? arg('expect-acts').split(',').map((s) => s.trim()) : null;
  const apply = process.argv.includes('--apply');
  if (!Number.isInteger(keep) || keep < 1) {
    console.error('--keep musbat butun son bo\'lishi kerak.');
    process.exit(1);
  }
  if (apply && !expectActs) {
    console.error("--apply uchun --expect-acts majburiy (noto'g'ri yozuvlar qolib ketmasligi uchun).");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  run(prisma, { keep, expectActs, apply })
    .then((r) => process.exit(r.ok ? 0 : 2))
    .catch((e) => {
      console.error('Xato:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
