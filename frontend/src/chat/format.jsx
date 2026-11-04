import React from 'react';
import { tr, currentLang, dateLocale } from '../i18n/tr.js';

// Xabar matnini React elementlariga aylantirish (dangerouslySetInnerHTML'siz):
// havolalar, @eslatmalar, *qalin*, _kursiv_, `kod`.
const URL_RE = /(https?:\/\/[^\s<>"]+[^\s<>".,:;'")\]!?])/g;
const STYLE_RE = /(`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

function splitBy(text, re, onMatch, onText) {
  const out = [];
  let last = 0;
  text.replace(re, (match, ...args) => {
    const index = args[args.length - 2];
    if (index > last) out.push(...onText(text.slice(last, index)));
    out.push(onMatch(match));
    last = index + match.length;
    return match;
  });
  if (last < text.length) out.push(...onText(text.slice(last)));
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function styled(text, key) {
  return splitBy(
    text,
    STYLE_RE,
    (m) => {
      const inner = m.slice(1, -1);
      if (m[0] === '`') return <code key={key()} className="rounded bg-black/10 px-1 font-mono text-[0.85em]">{inner}</code>;
      if (m[0] === '*') return <strong key={key()}>{inner}</strong>;
      return <em key={key()}>{inner}</em>;
    },
    (t) => [t]
  );
}

export function renderText(text, { mentionNames = [], mine = false } = {}) {
  if (!text) return null;
  let n = 0;
  const key = () => `t${n++}`;
  const mentionRe = mentionNames.length
    ? new RegExp(`(${mentionNames.filter(Boolean).map((x) => `@${escapeRe(x)}`).join('|')})`, 'g')
    : null;

  const withMentions = (t) =>
    mentionRe
      ? splitBy(
          t,
          mentionRe,
          (m) => (
            <span key={key()} className={`rounded px-0.5 font-semibold ${mine ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
              {m}
            </span>
          ),
          (rest) => styled(rest, key)
        )
      : styled(t, key);

  return splitBy(
    text,
    URL_RE,
    (url) => (
      <a key={key()} href={url} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">
        {url}
      </a>
    ),
    withMentions
  );
}

// 1–3 ta emojidan iborat xabar katta ko'rsatiladi.
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|️|‍|⃣)+$/u;
export function bigEmojiCount(text) {
  const t = (text || '').replace(/\s+/g, '');
  if (!t || t.length > 40 || !EMOJI_ONLY.test(t)) return 0;
  const count = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(t)].length : Math.ceil(t.length / 2);
  return count <= 3 ? count : 0;
}

const pad = (v) => String(v).padStart(2, '0');
export const formatTime = (d) => {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};
export function dayLabel(d) {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return tr('Bugun');
  if (diff === 1) return tr('Kecha');
  const x = new Date(d);
  const sameYear = x.getFullYear() === new Date().getFullYear();
  if (currentLang() !== 'uz') return x.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) });
  return `${x.getDate()}-${MONTHS[x.getMonth()]}${sameYear ? '' : `, ${x.getFullYear()}`}`;
}
export const sameDay = (a, b) => startOfDay(a) === startOfDay(b);

// Ro'yxatdagi qisqa vaqt: bugun — soat, aks holda sana.
export function shortStamp(d) {
  if (!d) return '';
  if (sameDay(d, new Date())) return formatTime(d);
  const x = new Date(d);
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}`;
}

export function lastSeenText(online, lastSeenAt) {
  if (online) return tr('onlayn');
  if (!lastSeenAt) return tr("yaqinda bo'lmagan");
  const mins = Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
  if (mins < 1) return tr('hozirgina edi');
  if (mins < 60) return tr('{0} daqiqa oldin edi', mins);
  if (sameDay(lastSeenAt, new Date())) return tr('bugun {0} da edi', formatTime(lastSeenAt));
  return tr('{0} {1} da edi', dayLabel(lastSeenAt).toLowerCase(), formatTime(lastSeenAt));
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const formatDuration = (sec) => {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};

export const initials = (name) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

const AVATAR_COLORS = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500'];
export const avatarColor = (id) => AVATAR_COLORS[[...(id || '')].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
