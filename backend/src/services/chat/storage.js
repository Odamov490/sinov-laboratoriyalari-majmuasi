const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CHAT_STORAGE_DIR } = require('../../config/env');

// Chat fayllari ombori. Kalit — "yyyy/mm/<uuid>" ko'rinishidagi nisbiy yo'l;
// asl fayl nomi faqat bazada. Bu katalog hech qachon statik berilmaydi.
const ROOT = path.resolve(process.cwd(), CHAT_STORAGE_DIR);
const TMP = path.join(ROOT, 'tmp');
const KEY_RE = /^[A-Za-z0-9/_.-]+$/;

function ensureDirs() {
  fs.mkdirSync(TMP, { recursive: true });
}

function resolveKey(key) {
  if (!key || !KEY_RE.test(key) || key.includes('..')) throw new Error('Invalid storage key');
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error('Invalid storage key');
  return full;
}

// Yangi kalit va uning katalogi.
function newKey(prefix = '') {
  const d = new Date();
  const dir = `${prefix}${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  return `${dir}/${crypto.randomUUID()}`;
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

// Diskdagi umumiy hajm (sozlamalar sahifasi uchun).
async function diskUsage(dir = ROOT) {
  let total = 0;
  let files = 0;
  let entries = [];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return { total, files };
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await diskUsage(full);
      total += sub.total;
      files += sub.files;
    } else if (e.isFile()) {
      total += (await fs.promises.stat(full)).size;
      files += 1;
    }
  }
  return { total, files };
}

module.exports = { ROOT, TMP, ensureDirs, resolveKey, newKey, removeKeys, diskUsage };
