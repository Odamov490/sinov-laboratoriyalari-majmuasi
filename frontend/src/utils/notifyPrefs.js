import { tr } from '../i18n/tr.js';
// Bildirishnoma sozlamalarini KLIENTDA qo'llash: brauzer bildirishnomasi,
// ovoz va tinch soatlar. Serverda faqat "Sayt ichida" (inApp) hisobga olinadi.

export const EVENT_LABELS = {
  task_assigned: tr('Menga vazifa tayinlandi'),
  task_status: tr("Vazifam holati o'zgardi"),
  task_comment: tr('Vazifaga izoh yozildi'),
  task_due: tr("Vazifa muddati yaqin / o'tdi"),
  chat_direct: tr('Chat: shaxsiy xabar'),
  chat_mention: tr('Chat: meni eslatishdi (@)'),
  chat_group: tr('Chat: guruh va laboratoriya xabarlari'),
  chat_announcement: tr("Chat: e'lonlar"),
};

// Notification.type -> voqea.
export const TYPE_TO_EVENT = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS: 'task_status',
  TASK_COMMENT: 'task_comment',
  TASK_DUE_SOON: 'task_due',
  TASK_OVERDUE: 'task_due',
};

let current = null; // user.preferences (/auth/me)
export const setNotifyPrefs = (prefs) => {
  current = prefs || null;
};

const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return h * 60 + m;
};

// Tinch soatlar (masalan 22:00–08:00, yarim tundan o'tishi mumkin).
export function inQuietHours(prefs = current, now = new Date()) {
  const q = prefs?.quietHours;
  if (!q?.enabled) return false;
  const t = now.getHours() * 60 + now.getMinutes();
  const from = toMin(q.from);
  const to = toMin(q.to);
  return from <= to ? t >= from && t < to : t >= from || t < to;
}

function channel(event, name, prefs = current) {
  const v = prefs?.notifications?.[event]?.[name];
  return v === undefined ? true : v;
}

export const browserPermission = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

export async function requestBrowserPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

let audioCtx = null;
export function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(620, audioCtx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {
    /* ovoz chiqmasa — muhim emas */
  }
}

// Voqea uchun ovoz va brauzer bildirishnomasi (sozlamaga va tinch soatlarga qarab).
export function alertFor(event, { title, body, tag, onClick } = {}) {
  if (inQuietHours()) return;
  if (channel(event, 'sound')) beep();
  if (channel(event, 'browser') && browserPermission() === 'granted' && document.visibilityState !== 'visible') {
    try {
      const n = new Notification(title || 'SLM', { body: (body || '').slice(0, 140), tag });
      n.onclick = () => {
        window.focus();
        onClick?.();
        n.close();
      };
    } catch {
      /* ba'zi brauzerlarda Notification konstruktori yo'q */
    }
  }
}

// "Sinov xabari": ruxsat va tinch soatlardan qat'i nazar darhol ko'rsatiladi.
export function testNotification() {
  beep();
  if (browserPermission() !== 'granted') return false;
  try {
    new Notification(tr('SLM — sinov xabari'), { body: tr('Brauzer bildirishnomalari ishlayapti.') });
    return true;
  } catch {
    return false;
  }
}
