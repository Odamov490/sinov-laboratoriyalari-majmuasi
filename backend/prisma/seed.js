/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

// NOTE: This is MINIMAL DEMO DATA for local development only.
// Per project rules, no fake prices/phones/addresses/accreditation/staff
// are invented as if they were real production content. Real content
// must be entered through the Admin Panel by the organization.

const LABS = [
  { slug: 'polimer', nameUz: 'Polimer mahsulotlarini sinash laboratoriyasi', nameRu: 'Лаборатория испытаний полимерной продукции', nameEn: 'Polymer Products Testing Laboratory' },
  { slug: 'elektrotexnika', nameUz: 'Elektrotexnika mahsulotlarini sinash laboratoriyasi', nameRu: 'Лаборатория испытаний электротехнической продукции', nameEn: 'Electrotechnical Products Testing Laboratory' },
  { slug: 'kimyoviy-biologik', nameUz: 'Kimyoviy-biologik xavfsizlik laboratoriyasi', nameRu: 'Лаборатория химико-биологической безопасности', nameEn: 'Chemical-Biological Safety Laboratory' },
  { slug: 'emc', nameUz: 'Elektromagnit moslashuvchanlikni sinash laboratoriyasi', nameRu: 'Лаборатория испытаний электромагнитной совместимости', nameEn: 'Electromagnetic Compatibility Testing Laboratory' },
  { slug: 'yengil-sanoat', nameUz: 'Yengil sanoat mahsulotlarini sinash laboratoriyasi', nameRu: 'Лаборатория испытаний продукции легкой промышленности', nameEn: 'Light Industry Products Testing Laboratory' },
  { slug: 'energiya-samaradorligi', nameUz: 'Energiya samaradorligini sinash laboratoriyasi', nameRu: 'Лаборатория испытаний энергоэффективности', nameEn: 'Energy Efficiency Testing Laboratory' },
  { slug: 'oyinchoqlar', nameUz: 'Bolalar o‘yinchoqlarini sinash laboratoriyasi', nameRu: 'Лаборатория испытаний детских игрушек', nameEn: 'Children\'s Toys Testing Laboratory' },
  { slug: 'chirchiq', nameUz: 'Sinov laboratoriyalari majmuasi — Chirchiq filiali', nameRu: 'Комплекс испытательных лабораторий — филиал в Чирчике', nameEn: 'Testing Laboratories Complex — Chirchiq Branch' },
];

async function main() {
  console.log('Seeding DEMO data...');

  // 1 admin user
  const adminEmail = 'admin@slm.uz';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await argon2.hash('Admin@12345');
    await prisma.user.create({
      data: {
        fullName: 'Super Administrator',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`Created default admin: ${adminEmail} (change password in production!)`);
  }

  // 8 laboratories (structure only — no invented services/prices/staff)
  for (let i = 0; i < LABS.length; i += 1) {
    const lab = LABS[i];
    await prisma.laboratory.upsert({
      where: { slug: lab.slug },
      update: {},
      create: { ...lab, order: i, isActive: true },
    });
  }
  console.log(`Upserted ${LABS.length} laboratories.`);

  // Baseline site settings (empty placeholders — filled via Admin Panel)
  const settingsDefaults = {
    org_name: 'Sinov Laboratoriyalari Majmuasi',
    phone: '',
    email: '',
    address: '',
    working_hours: '',
    telegram: '',
    instagram: '',
  };
  for (const [key, value] of Object.entries(settingsDefaults)) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
