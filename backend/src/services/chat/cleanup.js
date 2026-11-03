const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const prisma = require('../../config/prisma');
const { getSettings } = require('./settings');
const { removeKeys, TMP } = require('./storage');
const { chatEvents } = require('./events');

// Har kuni 03:30 (Toshkent):
//  1) 24 soatdan eski, xabarga biriktirilmagan (PENDING) fayllar o'chiriladi;
//  2) mediaRetentionDays > 0 bo'lsa — eski xabarlarning FAYLLARI o'chiriladi,
//     xabar va matn qoladi ("Fayl muddati tugagan"). Matn hech qachon
//     avtomatik o'chirilmaydi. Stikerlar bunga kirmaydi.
const TZ = 'Asia/Tashkent';
const DAY = 24 * 60 * 60 * 1000;

async function runChatCleanup() {
  const pending = await prisma.chatAttachment.findMany({
    where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - DAY) } },
    select: { id: true, storageKey: true, thumbKey: true },
  });
  if (pending.length) {
    await prisma.chatAttachment.deleteMany({ where: { id: { in: pending.map((a) => a.id) } } });
    await removeKeys(pending.flatMap((a) => [a.storageKey, a.thumbKey]));
  }

  let expired = 0;
  const { mediaRetentionDays } = await getSettings();
  if (mediaRetentionDays > 0) {
    const cutoff = new Date(Date.now() - mediaRetentionDays * DAY);
    for (;;) {
      const batch = await prisma.chatAttachment.findMany({
        where: { status: 'ATTACHED', expiredAt: null, createdAt: { lt: cutoff } },
        select: { id: true, storageKey: true, thumbKey: true, message: { select: { id: true, roomId: true } } },
        take: 500,
      });
      if (!batch.length) break;
      await prisma.chatAttachment.updateMany({ where: { id: { in: batch.map((a) => a.id) } }, data: { expiredAt: new Date() } });
      await removeKeys(batch.flatMap((a) => [a.storageKey, a.thumbKey]));
      expired += batch.length;
      const rooms = new Set(batch.map((a) => a.message?.roomId).filter(Boolean));
      rooms.forEach((roomId) => chatEvents.emit('room:updated', { roomId, media: true }));
    }
  }

  // Multer'dan qolib ketgan vaqtinchalik fayllar.
  let tmp = 0;
  const files = await fs.promises.readdir(TMP).catch(() => []);
  for (const name of files) {
    const full = path.join(TMP, name);
    const st = await fs.promises.stat(full).catch(() => null);
    if (st?.isFile() && Date.now() - st.mtimeMs > DAY) {
      await fs.promises.unlink(full).catch(() => {});
      tmp += 1;
    }
  }
  return { pendingRemoved: pending.length, expired, tmpRemoved: tmp };
}

function startChatCleanup() {
  cron.schedule(
    '30 3 * * *',
    () => {
      runChatCleanup()
        .then((r) => console.log(`[chat] cleanup: pending=${r.pendingRemoved} expired=${r.expired} tmp=${r.tmpRemoved}`))
        .catch((err) => console.error(`[chat] cleanup failed: ${err.code || err.name}`));
    },
    { timezone: TZ }
  );
}

module.exports = { runChatCleanup, startChatCleanup };
