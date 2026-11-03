const fs = require('fs');
const path = require('path');
const { CHAT_STORAGE_DIR } = require('../../config/env');

// Chat fayllari ombori. Kalit — "yyyy/mm/<uuid>" ko'rinishidagi nisbiy yo'l;
// asl fayl nomi faqat bazada. Bu katalog hech qachon statik berilmaydi.
const ROOT = path.resolve(process.cwd(), CHAT_STORAGE_DIR);
const KEY_RE = /^[A-Za-z0-9/_.-]+$/;

function resolveKey(key) {
  if (!key || !KEY_RE.test(key) || key.includes('..')) throw new Error('Invalid storage key');
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error('Invalid storage key');
  return full;
}

// Fayllarni o'chiradi; yo'q fayl xato emas. Fayl nomlari loglanmaydi.
async function removeKeys(keys) {
  let failed = 0;
  for (const key of keys.filter(Boolean)) {
    try {
      await fs.promises.unlink(resolveKey(key));
    } catch (err) {
      if (err.code !== 'ENOENT') failed += 1;
    }
  }
  if (failed) console.error(`[chat] ${failed} ta faylni o'chirib bo'lmadi`);
}

module.exports = { ROOT, resolveKey, removeKeys };
