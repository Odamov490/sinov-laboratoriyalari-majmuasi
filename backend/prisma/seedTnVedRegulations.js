/* eslint-disable no-console */
// One-time import of the TN VED conformity-regulation reference table
// (Cabinet of Ministers resolutions 502 and 43) into the TnVedRegulation
// table. Run manually, not part of the regular seed.js.
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORY_MAP = {
  sertifikat: 'SERTIFIKAT',
  deklaratsiya: 'DEKLARATSIYA',
};

async function main() {
  const filePath = path.join(__dirname, 'seed-data', 'tnved-reference.json');
  const records = require(filePath);

  console.log(`Loaded ${records.length} records from ${filePath}`);

  await prisma.tnVedRegulation.deleteMany({});

  const data = records.map((r) => ({
    item: r.item,
    nameUz: r.nameUz,
    tnVedRaw: r.tnVedRaw,
    category: CATEGORY_MAP[r.category],
    decision: r.decision,
  }));

  const invalid = data.filter((d) => !d.category);
  if (invalid.length) {
    throw new Error(`Unknown category value(s) found in ${invalid.length} record(s).`);
  }

  const result = await prisma.tnVedRegulation.createMany({ data });
  console.log(`Imported ${result.count} TnVedRegulation records.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
