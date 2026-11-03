import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Square, X } from 'lucide-react';
import { startVoice, startVideoNote, mediaError } from '../../../chat/recorders';
import { formatDuration } from '../../../chat/format';

// Ovoz yozish paneli (composer o'rnida). Ruxsat tugma bosilganda so'raladi.
export function VoiceRecorder({ maxSeconds, onSend, onCancel, onError }) {
  const rec = useRef(null);
  const canvas = useRef(null);
  const levels = useRef([]);
  const [sec, setSec] = useState(0);
  const [ready, setReady] = useState(false);

  const finish = async (send) => {
    const r = rec.current;
    rec.current = null;
    if (!r) return;
    if (!send) {
      r.cancel();
      onCancel();
      return;
    }
    const result = await r.stop();
    if (result.duration < 0.7) {
      onError('Ovozli xabar juda qisqa.');
      onCancel();
      return;
    }
    onSend(result);
  };

  useEffect(() => {
    let alive = true;
    startVoice({
      maxSeconds,
      onTick: (s) => alive && setSec(s),
      onLevel: (l) => {
        levels.current.push(l);
        if (levels.current.length > 60) levels.current.shift();
        const c = canvas.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#0B3A63';
        levels.current.forEach((v, i) => {
          const h = Math.max(2, v * c.height);
          ctx.fillRect(i * 4, (c.height - h) / 2, 2, h);
        });
      },
      onAutoStop: () => finish(true),
    })
      .then((r) => {
        if (!alive) {
          r.cancel();
          return;
        }
        rec.current = r;
        setReady(true);
      })
      .catch((err) => {
        onError(mediaError(err, 'mikrofon'));
        onCancel();
      });
    return () => {
      alive = false;
      rec.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl bg-bg-light px-3 py-2">
      <button type="button" onClick={() => finish(false)} className="rounded-full p-2 text-slate-500 hover:bg-white hover:text-red-600" title="Bekor qilish">
        <Trash2 className="h-5 w-5" />
      </button>
      <span className="flex items-center gap-2 text-sm font-medium tabular-nums text-ink">
        <span className={`h-2.5 w-2.5 rounded-full bg-red-500 ${ready ? 'animate-pulse' : 'opacity-40'}`} />
        {formatDuration(sec)} / {formatDuration(maxSeconds)}
      </span>
      <canvas ref={canvas} width={240} height={32} className="h-8 min-w-0 flex-1" />
      <button type="button" disabled={!ready} onClick={() => finish(true)} className="rounded-full bg-primary p-2.5 text-white hover:bg-primary-light disabled:opacity-50" title="Yuborish">
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

// Dumaloq video-xabar: to'liq ekran ustidagi oyna, jonli dumaloq ko'rinish.
export function VideoNoteRecorder({ maxSeconds, onSend, onCancel, onError }) {
  const rec = useRef(null);
  const video = useRef(null);
  const [sec, setSec] = useState(0);
  const [ready, setReady] = useState(false);

  const finish = async (send) => {
    const r = rec.current;
    rec.current = null;
    if (!r) return;
    if (!send) {
      r.cancel();
      onCancel();
      return;
    }
    const result = await r.stop();
    if (result.duration < 1) {
      onError('Video xabar juda qisqa.');
      onCancel();
      return;
    }
    onSend(result);
  };

  useEffect(() => {
    let alive = true;
    startVideoNote({ maxSeconds, onTick: (s) => alive && setSec(s), onAutoStop: () => finish(true) })
      .then((r) => {
        if (!alive) {
          r.cancel();
          return;
        }
        rec.current = r;
        if (video.current) video.current.srcObject = r.stream;
        setReady(true);
      })
      .catch((err) => {
        onError(mediaError(err, 'kamera'));
        onCancel();
      });
    return () => {
      alive = false;
      rec.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const C = 2 * Math.PI * 128;
  return (
    <div className="fixed inset-0 z-[125] flex flex-col items-center justify-center gap-6 bg-black/80 p-4">
      <div className="relative h-64 w-64">
        <video ref={video} autoPlay muted playsInline className="h-64 w-64 -scale-x-100 rounded-full bg-slate-800 object-cover" />
        <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="128" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
          <circle cx="130" cy="130" r="128" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(sec / maxSeconds, 1))} />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium tabular-nums text-white">
        <span className={`h-2.5 w-2.5 rounded-full bg-red-500 ${ready ? 'animate-pulse' : 'opacity-40'}`} />
        {formatDuration(sec)} / {formatDuration(maxSeconds)}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => finish(false)} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20" title="Bekor qilish">
          <X className="h-6 w-6" />
        </button>
        <button type="button" disabled={!ready} onClick={() => finish(true)} className="rounded-full bg-red-500 p-4 text-white hover:bg-red-600 disabled:opacity-50" title="To'xtatish va yuborish">
          <Square className="h-6 w-6 fill-current" />
        </button>
      </div>
    </div>
  );
}
