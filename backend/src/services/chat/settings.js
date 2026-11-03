const prisma = require('../../config/prisma');

// ChatSetting — yagona qator (id = 1). Har so'rovda bazaga bormaslik uchun
// qisqa muddat xotirada saqlanadi; PUT dan keyin invalidateSettings().
const TTL_MS = 30 * 1000;
let cached = null;
let cachedAt = 0;

async function getSettings() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  cached = await prisma.chatSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  cachedAt = Date.now();
  return cached;
}

function invalidateSettings() {
  cached = null;
}

module.exports = { getSettings, invalidateSettings };
