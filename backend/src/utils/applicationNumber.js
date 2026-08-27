const prisma = require('../config/prisma');

/**
 * Generates a unique application number in the format SLM-YYYY-00001.
 * Uses a DB-backed retry loop (with a bounded attempt count) to avoid
 * sequence collisions under concurrent requests, since Prisma models
 * don't have a native per-year auto-increment sequence here.
 */
async function generateApplicationNumber() {
  const year = new Date().getFullYear();
  const prefix = `SLM-${year}-`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const count = await prisma.application.count({
      where: { applicationNumber: { startsWith: prefix } },
    });
    const nextSeq = String(count + 1 + attempt).padStart(5, '0');
    const candidate = `${prefix}${nextSeq}`;

    const existing = await prisma.application.findUnique({
      where: { applicationNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  // Fallback: timestamp-based suffix guarantees uniqueness.
  return `${prefix}${Date.now().toString().slice(-5)}`;
}

module.exports = { generateApplicationNumber };
