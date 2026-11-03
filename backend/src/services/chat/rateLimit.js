// Foydalanuvchi bo'yicha (IP emas) sirpanuvchi oyna. REST va socket bitta
// hisoblagichdan foydalanadi. Bitta konteyner — xotiradagi Map yetarli.
const { tooMany } = require('./errors');

const LIMITS = {
  message: { max: 40, windowMs: 60 * 1000 },
  upload: { max: 10, windowMs: 60 * 1000 },
};

const hits = new Map(); // `${kind}:${userId}` -> number[] (vaqtlar)

function consume(kind, userId) {
  const { max, windowMs } = LIMITS[kind];
  const key = `${kind}:${userId}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    throw tooMany(kind === 'upload' ? "Juda ko'p fayl yuklandi. Bir daqiqadan so'ng urinib ko'ring." : "Juda ko'p xabar. Bir daqiqadan so'ng urinib ko'ring.");
  }
  list.push(now);
  hits.set(key, list);
}

// Eski kalitlarni vaqti-vaqti bilan tozalash.
setInterval(() => {
  const now = Date.now();
  for (const [key, list] of hits) {
    if (!list.some((t) => now - t < 60 * 1000)) hits.delete(key);
  }
}, 5 * 60 * 1000).unref();

module.exports = { consume, LIMITS };
