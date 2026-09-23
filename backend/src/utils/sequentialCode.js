const prisma = require('../config/prisma');

// Generates the next sequential registry code within the current year, e.g.
// "NC-2026-001", "NC-2026-002" — used by SMK modules whose `code` field is
// server-assigned rather than admin-typed (mirrors how Application already
// gets its own server-generated `applicationNumber`). Counts existing rows
// whose code already starts with this year's prefix, so gaps left by
// deleted rows are never reused.
async function nextSequentialCode(modelName, prefix, { year = new Date().getFullYear(), digits = 3 } = {}) {
  const yearPrefix = `${prefix}-${year}-`;
  const count = await prisma[modelName].count({ where: { code: { startsWith: yearPrefix } } });
  const seq = String(count + 1).padStart(digits, '0');
  return `${yearPrefix}${seq}`;
}

module.exports = { nextSequentialCode };
