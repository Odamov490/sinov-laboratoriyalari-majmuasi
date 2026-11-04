import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { tr } from '../../../i18n/tr.js';

// Emoji tanlagich faqat ochilganda yuklanadi (dinamik import). Rasmlar
// CDN'dan emas — tizim emoji shriftidan (emojiStyle="native").
let pickerModule = null;
export function EmojiPicker({ onPick, onClose, inline }) {
  const [mod, setMod] = useState(pickerModule);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (mod) return;
    import('emoji-picker-react')
      .then((m) => {
        pickerModule = m;
        setMod(m);
      })
      .catch(() => setFailed(true));
  }, [mod]);

  const body = failed ? (
          <div className="rounded-xl border border-border bg-white p-4 text-sm text-slate-500 shadow-xl">{tr("Emoji ro'yxatini yuklab bo'lmadi.")}</div>
        ) : !mod ? (
          <div className="flex h-24 w-72 items-center justify-center rounded-xl border border-border bg-white shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <mod.default
            onEmojiClick={(d) => onPick(d.emoji)}
            emojiStyle={mod.EmojiStyle.NATIVE}
            lazyLoadEmojis
            searchPlaceholder={tr('Qidirish')}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            width={320}
            height={380}
            categories={[
              { category: 'suggested', name: tr("So'nggi") },
              { category: 'smileys_people', name: tr('Yuzlar va odamlar') },
              { category: 'animals_nature', name: tr('Tabiat') },
              { category: 'food_drink', name: tr('Taom') },
              { category: 'travel_places', name: tr('Joylar') },
              { category: 'activities', name: tr('Faoliyat') },
              { category: 'objects', name: tr('Buyumlar') },
              { category: 'symbols', name: tr('Belgilar') },
              { category: 'flags', name: tr('Bayroqlar') },
            ]}
          />
        );
  if (inline) return body;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-50 mb-2">{body}</div>
    </>
  );
}

const RECENT_KEY = 'slm-chat-recent-stickers';
export const readRecentStickers = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
};
export const pushRecentSticker = (id) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecentStickers().filter((x) => x !== id)].slice(0, 24)));
  } catch {
    /* saqlanmasa ham ishlaydi */
  }
};

export function StickerPicker({ packs, onPick, onClose }) {
  const all = new Map(packs.flatMap((p) => p.stickers.map((s) => [s.id, s])));
  const recent = readRecentStickers().map((id) => all.get(id)).filter(Boolean);
  const [tab, setTab] = useState(recent.length ? 'recent' : packs[0]?.id);
  const list = tab === 'recent' ? recent : packs.find((p) => p.id === tab)?.stickers || [];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-50 mb-2 w-[320px] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-white shadow-xl">
        <div className="flex gap-1 overflow-x-auto border-b border-border p-1.5">
          <button type="button" onClick={() => setTab('recent')} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${tab === 'recent' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-bg-light'}`}>
            {tr("So'nggi")}
          </button>
          {packs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setTab(p.id)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${tab === p.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-bg-light'}`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <div className="grid h-64 grid-cols-4 gap-1 overflow-y-auto p-2">
          {list.length === 0 && <p className="col-span-4 p-4 text-center text-sm text-slate-400">{tab === 'recent' ? tr('Hali stiker yuborilmagan.') : tr("To'plam bo'sh.")}</p>}
          {list.map((s) => (
            <button key={s.id} type="button" onClick={() => onPick(s)} className="rounded-lg p-1 hover:bg-bg-light" title={s.emoji || ''}>
              <img src={s.url} alt={s.emoji || tr('Stiker')} className="h-16 w-16 object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
