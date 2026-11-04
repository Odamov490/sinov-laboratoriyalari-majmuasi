import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet, FileArchive, File as FileIcon, Pause, Play, X, Clock } from 'lucide-react';
import { mediaUrl, claimPlayback } from '../../../chat/chatStore';
import { formatDuration, formatSize } from '../../../chat/format';
import { tr } from '../../../i18n/tr.js';

// Imzolangan havola: muddati tugashidan oldin avtomatik yangilanadi.
export function useMediaUrl(att) {
  const [urls, setUrls] = useState(() => (att?.url ? { url: att.url, thumbUrl: att.thumbUrl } : null));
  useEffect(() => {
    if (!att || att.expired) return undefined;
    let alive = true;
    let timer = null;
    const load = () =>
      mediaUrl(att).then((u) => {
        if (!alive || !u) return;
        setUrls(u);
        const exp = Number(/[?&]e=(\d+)/.exec(u.url)?.[1] || 0) * 1000;
        if (exp) timer = setTimeout(load, Math.max(exp - Date.now() - 90 * 1000, 30 * 1000));
      });
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [att?.id, att?.expired]);
  return urls;
}

export const downloadHref = (url) => (url ? `${url}&dl=1` : undefined);

export function ExpiredMedia({ label = tr('Fayl muddati tugagan') }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs italic text-slate-500">
      <Clock className="h-4 w-4" /> {label}
    </div>
  );
}

function ImageTile({ att, onOpen, className }) {
  const urls = useMediaUrl(att);
  const [loaded, setLoaded] = useState(false);
  if (att.expired) return <ExpiredMedia />;
  const src = urls?.thumbUrl || urls?.url;
  return (
    <button type="button" onClick={onOpen} className={`relative block overflow-hidden bg-slate-200 ${className}`}>
      {src && (
        <img
          src={src}
          alt={att.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </button>
  );
}

export function ImageGrid({ attachments, onOpen }) {
  const n = attachments.length;
  if (n === 1) {
    const a = attachments[0];
    const ratio = a.width && a.height ? a.height / a.width : 0.75;
    const w = Math.min(320, a.width || 320);
    return (
      <div style={{ width: w, maxWidth: '100%' }}>
        <div style={{ paddingTop: `${Math.min(Math.max(ratio, 0.4), 1.6) * 100}%` }} className="relative">
          <ImageTile att={a} onOpen={() => onOpen(0)} className="!absolute inset-0 rounded-lg" />
        </div>
      </div>
    );
  }
  return (
    <div className={`grid w-[320px] max-w-full gap-0.5 overflow-hidden rounded-lg ${n === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {attachments.map((a, i) => (
        <ImageTile key={a.id} att={a} onOpen={() => onOpen(i)} className="aspect-square" />
      ))}
    </div>
  );
}

function LightboxImage({ att }) {
  const urls = useMediaUrl(att);
  if (att.expired) return <ExpiredMedia />;
  return urls ? <img src={urls.url} alt={att.name} className="max-h-[85vh] max-w-[92vw] select-none object-contain" /> : null;
}

export function Lightbox({ items, index, onClose }) {
  const [i, setI] = useState(index);
  const att = items[i];
  const urls = useMediaUrl(att);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
      if (e.key === 'ArrowRight') setI((v) => Math.min(items.length - 1, v + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClose]);
  if (!att) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90" onClick={onClose} role="dialog" aria-label={tr('Rasm')}>
      <div className="absolute right-3 top-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {urls && (
          <a href={downloadHref(urls.url)} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" title={tr('Yuklab olish')}>
            <Download className="h-5 w-5" />
          </a>
        )}
        <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" title={tr('Yopish')}>
          <X className="h-5 w-5" />
        </button>
      </div>
      {i > 0 && (
        <button
          className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setI(i - 1);
          }}
          title={tr('Oldingi')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <div onClick={(e) => e.stopPropagation()}>
        <LightboxImage key={att.id} att={att} />
      </div>
      {i < items.length - 1 && (
        <button
          className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setI(i + 1);
          }}
          title={tr('Keyingi')}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
      {items.length > 1 && <div className="absolute bottom-4 text-sm text-white/70">{i + 1} / {items.length}</div>}
    </div>
  );
}

export function VideoAttachment({ att }) {
  const urls = useMediaUrl(att);
  if (att.expired) return <ExpiredMedia />;
  const ratio = att.width && att.height ? `${att.width} / ${att.height}` : '16 / 9';
  return (
    <video
      controls
      preload="metadata"
      playsInline
      poster={urls?.thumbUrl || undefined}
      src={urls?.url}
      onPlay={(e) => claimPlayback(e.currentTarget)}
      className="w-[320px] max-w-full rounded-lg bg-black"
      style={{ aspectRatio: ratio, maxHeight: 360 }}
    />
  );
}

const fileIcon = (name = '') => {
  if (/\.(xlsx|csv)$/i.test(name)) return FileSpreadsheet;
  if (/\.zip$/i.test(name)) return FileArchive;
  if (/\.(pdf|docx|pptx|txt)$/i.test(name)) return FileText;
  return FileIcon;
};

export function FileAttachment({ att, mine }) {
  const urls = useMediaUrl(att);
  const Icon = fileIcon(att.name);
  if (att.expired) return <ExpiredMedia label={tr('{0} — fayl muddati tugagan', att.name)} />;
  return (
    <a
      href={downloadHref(urls?.url)}
      className={`flex min-w-[220px] max-w-[320px] items-center gap-3 rounded-lg p-2 ${mine ? 'bg-white/15 hover:bg-white/25' : 'bg-bg-light hover:bg-slate-100'}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mine ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{att.name}</span>
        <span className={`text-xs ${mine ? 'text-white/70' : 'text-slate-500'}`}>{formatSize(att.size)}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}

// Ovozli xabar: to'lqin, o'tkazish, tezlik 1x/1.5x/2x; bir vaqtda bittasi.
const SPEEDS = [1, 1.5, 2];
export function VoicePlayer({ att, meta, mine }) {
  const urls = useMediaUrl(att);
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const duration = meta?.duration || att?.durationSec || 0;
  const bars = meta?.waveform?.length ? meta.waveform : Array(48).fill(0.3);
  if (att?.expired) return <ExpiredMedia />;

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      claimPlayback(el);
      el.playbackRate = speed;
      el.play().catch(() => {});
    } else el.pause();
  };
  const seek = (e) => {
    const el = audio.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - rect.left) / rect.width) * (Number.isFinite(el.duration) ? el.duration : duration);
  };
  const cycle = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audio.current) audio.current.playbackRate = next;
  };
  const played = progress * bars.length;
  return (
    <div className="flex w-[260px] max-w-full items-center gap-2">
      <audio
        ref={audio}
        src={urls?.url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const d = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : duration;
          setProgress(d ? e.currentTarget.currentTime / d : 0);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${mine ? 'bg-white text-primary' : 'bg-primary text-white'}`}
        title={playing ? tr('Pauza') : tr('Tinglash')}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="flex h-8 flex-1 cursor-pointer items-center gap-[2px]" onClick={seek}>
        {bars.map((v, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${i < played ? (mine ? 'bg-white' : 'bg-primary') : mine ? 'bg-white/40' : 'bg-primary/30'}`}
            style={{ height: `${Math.max(12, v * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={`text-[11px] ${mine ? 'text-white/80' : 'text-slate-500'}`}>{formatDuration(playing || progress ? progress * duration : duration)}</span>
        <button type="button" onClick={cycle} className={`rounded px-1 text-[10px] font-bold ${mine ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
          {speed}x
        </button>
      </div>
    </div>
  );
}

// Dumaloq video-xabar: bosilganda ovoz bilan o'ynaydi, atrofida progress.
export function VideoNote({ att, meta }) {
  const urls = useMediaUrl(att);
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  if (att?.expired) return <ExpiredMedia />;
  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      claimPlayback(el);
      el.muted = false;
      el.play().catch(() => {});
    } else el.pause();
  };
  const C = 2 * Math.PI * 104;
  const duration = meta?.duration || att?.durationSec || 0;
  return (
    <button type="button" onClick={toggle} className="relative h-52 w-52 shrink-0 rounded-full" title={playing ? tr('Pauza') : tr("Ko'rish")}>
      <video
        ref={video}
        src={urls?.url}
        poster={urls?.thumbUrl || undefined}
        preload="metadata"
        playsInline
        className="h-52 w-52 rounded-full bg-slate-800 object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const d = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : duration;
          setProgress(d ? e.currentTarget.currentTime / d : 0);
        }}
      />
      <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 208 208">
        <circle cx="104" cy="104" r="102" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
        <circle cx="104" cy="104" r="102" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
      </svg>
      {!playing && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
          {formatDuration(duration)}
        </span>
      )}
    </button>
  );
}
