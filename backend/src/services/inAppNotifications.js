// In-app notifications (the bell in the admin header). Nothing is e-mailed:
// staff logins are not real mailboxes.

const TZ = 'Asia/Tashkent';

// Today's calendar date in Tashkent as "YYYY-MM-DD".
const tashkentToday = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

// "YYYY-MM-DD" -> Date at UTC midnight (how @db.Date columns are stored).
const dateOnly = (ymd) => new Date(`${ymd}T00:00:00.000Z`);

const addDays = (ymd, days) => {
  const d = dateOnly(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Start of the current Tashkent day as an instant (for "once a day" checks).
function tashkentDayStart(now = new Date()) {
  // Tashkent is UTC+5 all year (no DST).
  return new Date(dateOnly(tashkentToday(now)).getTime() - 5 * 60 * 60 * 1000);
}

const taskLink = (taskId) => `/admin/vazifalar?task=${taskId}`;

// Creates one notification per recipient, skipping the actor and duplicates.
async function notifyUsers(db, userIds, { type, title, taskId = null, linkUrl = null, exceptUserId = null }) {
  const recipients = [...new Set(userIds)].filter((id) => id && id !== exceptUserId);
  if (!recipients.length) return 0;
  await db.notification.createMany({
    data: recipients.map((userId) => ({ userId, type, title, taskId, linkUrl: linkUrl || (taskId ? taskLink(taskId) : null) })),
  });
  return recipients.length;
}

module.exports = { TZ, tashkentToday, dateOnly, addDays, tashkentDayStart, taskLink, notifyUsers };
