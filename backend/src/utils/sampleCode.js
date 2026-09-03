const prisma = require('../config/prisma');

/**
 * Generates a unique sample tracking code in the format SMP-YYYY-00001.
 * Collision-safe, same pattern as the application-number generator.
 */
async function generateSampleCode() {
  const year = new Date().getFullYear();
  const prefix = `SMP-${year}-`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const count = await prisma.sample.count({ where: { code: { startsWith: prefix } } });
    const candidate = `${prefix}${String(count + 1 + attempt).padStart(5, '0')}`;

    const existing = await prisma.sample.findUnique({ where: { code: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  return `${prefix}${Date.now().toString().slice(-5)}`;
}

module.exports = { generateSampleCode };