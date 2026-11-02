/* eslint-disable no-console */
/**
 * Sinovlar jurnali (Excel "Журнал регистрации 2026") importi.
 *
 *   node prisma/seed/importTestJournal.js <json-fayl> [--dry-run]
 *
 * JSON fayl maxfiy (summalar, shartnomalar, xodimlar) — repozitoriyga
 * qo'shilmaydi, serverga qo'lda nusxalanadi.
 *
 * 1. Spravochniklar (mahsulot turi, joy, buyurtmachi) code/name bo'yicha
 *    yoziladi yoki yangilanadi.
 * 2. Yozuvlar importKey bo'yicha qo'shiladi. Bazada allaqachon bor yozuv
 *    O'ZGARTIRILMAYDI (admin tuzatishlari qayta importda yo'qolmasligi uchun),
 *    shuning uchun skriptni qayta ishga tushirish xavfsiz va takror yaratmaydi.
 * 3. Natija tekshiriladi: yozuvlar soni, varaqlar bo'yicha soni, hisobot
 *    qoidasi bo'yicha namunalar va summa, needsReview soni. Mos kelmasa —
 *    xato bilan to'xtaydi va (haqiqiy importda) hamma o'zgarish bekor qilinadi.
 *
 * --dry-run bazaga umuman ulanmaydi: faqat faylni tekshirib hisobot chiqaradi.
 */
const fs = require('fs');
const path = require('path');
const { reportSamples, reportAmount, reportMonth } = require('../../src/utils/testJournalReport');

const EXPECTED = { records: 460, samples: 1910, amount: 7099868400, needsReview: 10 };

const RESULTS = ['MOS', 'MOS_EMAS', 'QISMAN_MOS_EMAS', 'NAMUNA_TAQDIM_ETILMADI', 'BEKOR_QILINDI', 'KUTILMOQDA', 'KORIB_CHIQISH'];
const DIRECTIONS = ['XAVFSIZLIK', 'EMC', 'ENERGIYA', 'SHOVQIN'];
const PAYMENTS = ['TOLANGAN', 'TOLANMAGAN'];
const CANCELLED_BY = ['ARIZACHI', 'ORGAN'];

const fmt = (n) => Number(n).toLocaleString('ru-RU').replace(/,/g, ' ');
const toDate = (s) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

function parseArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('Foydalanish: node prisma/seed/importTestJournal.js <json-fayl> [--dry-run]');
    process.exit(1);
  }
  return { file: path.resolve(file), dryRun };
}

// Structural checks on the file itself, before anything touches the DB.
function validate(data) {
  const errors = [];
  const productCodes = new Set(data.dictionaries.productTypes.map((p) => p.code));
  const locationCodes = new Set(data.dictionaries.locations.map((l) => l.code));
  const bodyNames = new Set();
  data.certificationBodies.forEach((b) => {
    bodyNames.add(b.name);
    (b.aliases || []).forEach((a) => bodyNames.add(a));
  });
  const keys = new Set();

  data.records.forEach((r) => {
    const where = r.importKey || `${r.sourceSheet}:${r.sourceRow}`;
    if (!r.importKey) errors.push(`${where}: importKey yo'q`);
    else if (keys.has(r.importKey)) errors.push(`${where}: importKey takrorlangan`);
    keys.add(r.importKey);
    if (!productCodes.has(r.productType)) errors.push(`${where}: noma'lum mahsulot turi '${r.productType}'`);
    if (r.location && !locationCodes.has(r.location)) errors.push(`${where}: noma'lum joy '${r.location}'`);
    if (r.certificationBody && !bodyNames.has(r.certificationBody)) {
      errors.push(`${where}: buyurtmachi spravochnikda yo'q '${r.certificationBody}'`);
    }
    if (!RESULTS.includes(r.result)) errors.push(`${where}: noma'lum natija '${r.result}'`);
    (r.directions || []).forEach((d) => {
      if (!DIRECTIONS.includes(d)) errors.push(`${where}: noma'lum yo'nalish '${d}'`);
    });
    if (r.paymentStatus && !PAYMENTS.includes(r.paymentStatus)) errors.push(`${where}: noma'lum to'lov '${r.paymentStatus}'`);
    if (r.cancelledBy && !CANCELLED_BY.includes(r.cancelledBy)) errors.push(`${where}: noma'lum cancelledBy '${r.cancelledBy}'`);
    // The file carries its own precomputed report values — they must agree
    // with our rule, otherwise the rule and the source disagree somewhere.
    if (r.reportSamples !== undefined && r.reportSamples !== reportSamples(r)) {
      errors.push(`${where}: reportSamples ${r.reportSamples} != qoida bo'yicha ${reportSamples(r)}`);
    }
    if (r.reportAmount !== undefined && r.reportAmount !== reportAmount(r)) {
      errors.push(`${where}: reportAmount ${r.reportAmount} != qoida bo'yicha ${reportAmount(r)}`);
    }
  });
  return errors;
}

// Totals by the report rule; `sheetOf` maps a record to its Excel sheet name.
function summarize(records, sheetOf) {
  const bySheet = {};
  const byMonth = {};
  let samples = 0;
  let amount = 0;
  let needsReview = 0;
  records.forEach((r) => {
    const s = reportSamples(r);
    const a = reportAmount(r);
    samples += s;
    amount += a;
    if (r.needsReview) needsReview += 1;
    const sheet = sheetOf(r) || '—';
    bySheet[sheet] = bySheet[sheet] || { records: 0, samples: 0, amount: 0 };
    bySheet[sheet].records += 1;
    bySheet[sheet].samples += s;
    bySheet[sheet].amount += a;
    const month = reportMonth(r) || '—';
    byMonth[month] = byMonth[month] || { records: 0, samples: 0, amount: 0 };
    byMonth[month].records += 1;
    byMonth[month].samples += s;
    byMonth[month].amount += a;
  });
  return { records: records.length, samples, amount, needsReview, bySheet, byMonth };
}

function printSummary(title, s) {
  console.log(`\n=== ${title} ===`);
  console.log(`Yozuvlar: ${s.records}`);
  console.log(`Namunalar (hisobot qoidasi): ${fmt(s.samples)}`);
  console.log(`Summa (hisobot qoidasi): ${fmt(s.amount)} so'm`);
  console.log(`Tekshirish kerak (needsReview): ${s.needsReview}`);
  console.log('\nVaraqlar bo\'yicha:');
  Object.entries(s.bySheet).forEach(([sheet, v]) => {
    console.log(`  ${sheet.padEnd(18)} yozuv ${String(v.records).padStart(4)}  namuna ${String(v.samples).padStart(5)}  summa ${fmt(v.amount)}`);
  });
  console.log('\nOylar bo\'yicha:');
  Object.keys(s.byMonth)
    .sort()
    .forEach((m) => {
      const v = s.byMonth[m];
      console.log(`  ${m}  yozuv ${String(v.records).padStart(4)}  namuna ${String(v.samples).padStart(5)}  summa ${fmt(v.amount)}`);
    });
}

// Compares a summary with the expected numbers; returns mismatch messages.
function checkSummary(s, data) {
  const problems = [];
  if (s.records !== EXPECTED.records) problems.push(`yozuvlar ${s.records}, kutilgan ${EXPECTED.records}`);
  if (s.samples !== EXPECTED.samples) problems.push(`namunalar ${s.samples}, kutilgan ${EXPECTED.samples}`);
  if (Math.round(s.amount) !== EXPECTED.amount) problems.push(`summa ${fmt(s.amount)}, kutilgan ${fmt(EXPECTED.amount)}`);
  if (s.needsReview !== EXPECTED.needsReview) problems.push(`needsReview ${s.needsReview}, kutilgan ${EXPECTED.needsReview}`);
  (data.reconciliation || []).forEach((rec) => {
    const got = s.bySheet[rec.sheet];
    if (!got || got.records !== rec.records) {
      problems.push(`varaq '${rec.sheet}': yozuvlar ${got ? got.records : 0}, kutilgan ${rec.records}`);
    }
  });
  return problems;
}

function toRecordData(r, ids) {
  return {
    importKey: r.importKey,
    sourceSheet: r.sourceSheet ?? null,
    sourceRow: r.sourceRow ?? null,
    sheetNo: r.sheetNo ?? null,
    journalYear: r.journalYear,
    productTypeId: ids.productTypes[r.productType],
    certificationBodyId: r.certificationBody ? ids.bodies[r.certificationBody] : null,
    actNo: r.actNo ?? null,
    actDate: toDate(r.actDate),
    executorName: r.executor ?? null,
    sampleReceivedDate: toDate(r.sampleReceivedDate),
    sampleReceivedTime: r.sampleReceivedTime ?? null,
    sampleCount: r.sampleCount ?? null,
    cancelledSampleCount: r.cancelledSampleCount ?? 0,
    weightNote: r.weightNote ?? null,
    protocolDate: toDate(r.protocolDate),
    directions: r.directions || [],
    result: r.result,
    nonconformingCount: r.nonconformingCount ?? null,
    cancelledBy: r.cancelledBy ?? null,
    brand: r.brand ?? null,
    locationId: r.location ? ids.locations[r.location] : null,
    isRepeat: Boolean(r.isRepeat),
    contractNo: r.contractNo ?? null,
    contractDate: toDate(r.contractDate),
    amount: r.amount ?? null,
    paymentStatus: r.paymentStatus ?? null,
    notes: r.notes || [],
    raw: r.raw ?? undefined,
    needsReview: Boolean(r.needsReview),
    reviewReasons: r.reviewReasons || [],
  };
}

async function importToDb(prisma, data) {
  return prisma.$transaction(
    async (tx) => {
      const ids = { productTypes: {}, locations: {}, bodies: {} };

      for (const p of data.dictionaries.productTypes) {
        const row = await tx.testProductType.upsert({
          where: { code: p.code },
          create: { code: p.code, nameUz: p.nameUz },
          update: { nameUz: p.nameUz },
        });
        ids.productTypes[p.code] = row.id;
      }
      for (const l of data.dictionaries.locations) {
        const row = await tx.testLocation.upsert({
          where: { code: l.code },
          create: { code: l.code, nameUz: l.nameUz },
          update: { nameUz: l.nameUz },
        });
        ids.locations[l.code] = row.id;
      }
      for (const b of data.certificationBodies) {
        const existing = await tx.certificationBody.findUnique({ where: { name: b.name } });
        const aliases = [...new Set([...(existing?.aliases || []), ...(b.aliases || [])])];
        const row = existing
          ? await tx.certificationBody.update({ where: { id: existing.id }, data: { aliases } })
          : await tx.certificationBody.create({ data: { name: b.name, aliases } });
        ids.bodies[b.name] = row.id;
        (b.aliases || []).forEach((a) => {
          ids.bodies[a] = row.id;
        });
      }

      const existingKeys = new Set(
        (
          await tx.testJournalRecord.findMany({
            where: { importKey: { in: data.records.map((r) => r.importKey) } },
            select: { importKey: true },
          })
        ).map((r) => r.importKey)
      );
      const toCreate = data.records.filter((r) => !existingKeys.has(r.importKey));
      if (toCreate.length) {
        await tx.testJournalRecord.createMany({ data: toCreate.map((r) => toRecordData(r, ids)) });
      }

      // Verify against what is now in the DB (not the file).
      const inDb = await tx.testJournalRecord.findMany({
        where: { importKey: { in: data.records.map((r) => r.importKey) }, deletedAt: null },
        select: {
          sourceSheet: true,
          result: true,
          sampleCount: true,
          cancelledSampleCount: true,
          amount: true,
          needsReview: true,
          sampleReceivedDate: true,
          actDate: true,
        },
      });
      const dbSummary = summarize(inDb, (r) => r.sourceSheet);
      const problems = checkSummary(dbSummary, data);

      // Records that already existed may have been corrected by an admin, so
      // their DB totals can legitimately differ — only a fresh import must
      // match exactly.
      if (problems.length && existingKeys.size === 0) {
        throw new Error(`Bazadagi natija kutilganga mos emas:\n  - ${problems.join('\n  - ')}`);
      }
      return { created: toCreate.length, skipped: existingKeys.size, dbSummary, problems };
    },
    { timeout: 120000, maxWait: 10000 }
  );
}

async function main() {
  const { file, dryRun } = parseArgs(process.argv);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  const errors = validate(data);
  if (errors.length) {
    console.error(`Fayl tekshiruvdan o'tmadi (${errors.length} xato):\n  - ${errors.slice(0, 50).join('\n  - ')}`);
    process.exit(1);
  }

  const fileSummary = summarize(data.records, (r) => r.sourceSheet);
  printSummary(`Fayl: ${path.basename(file)}`, fileSummary);
  const fileProblems = checkSummary(fileSummary, data);
  if (fileProblems.length) {
    console.error(`\nFayl kutilgan raqamlarga mos emas:\n  - ${fileProblems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('\nFayl tekshiruvi: OK (460 yozuv, 1 910 namuna, 7 099 868 400 so\'m, 10 ta tekshirish kerak).');

  if (dryRun) {
    console.log('\n--dry-run: bazaga hech narsa yozilmadi.');
    return;
  }

  const prisma = require('../../src/config/prisma');
  try {
    const result = await importToDb(prisma, data);
    console.log(`\nImport: ${result.created} ta yangi yozuv qo'shildi, ${result.skipped} tasi bazada bor edi (o'zgartirilmadi).`);
    printSummary('Bazadagi holat', result.dbSummary);
    if (result.problems.length) {
      console.warn(
        `\nOgohlantirish: bazadagi raqamlar fayldan farq qiladi (avval import qilingan yozuvlar tahrirlangan bo'lishi mumkin):\n  - ${result.problems.join('\n  - ')}`
      );
    } else {
      console.log('\nBaza tekshiruvi: OK.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\nXATO: ${err.message}`);
  process.exit(1);
});
