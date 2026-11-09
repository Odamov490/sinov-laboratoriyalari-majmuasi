const cron = require('node-cron');
const { TZ } = require('./inAppNotifications');
const { cleanupAuthHistory } = require('./sessions');

// Har kuni 03:40 (Toshkent): 90 kundan eski kirish yozuvlari va eskirgan
// sessiyalar o'chiriladi.
function startAuthCleanup() {
  cron.schedule(
    '40 3 * * *',
    () => {
      cleanupAuthHistory()
        .then((r) => console.log(`[auth] cleanup: loginEvents=${r.events} sessions=${r.sessions}`))
        .catch((err) => console.error(`[auth] cleanup failed: ${err.code || err.name}`));
    },
    { timezone: TZ }
  );
}

module.exports = { startAuthCleanup };
