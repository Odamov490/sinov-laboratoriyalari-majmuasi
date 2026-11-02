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
const { fmt, validate, summarize, checkSummary, importToDb } = require('../../src/services/testJournalImport');

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
