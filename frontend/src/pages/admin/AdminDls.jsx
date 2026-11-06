import React, { useState } from 'react';
import { ExternalLink, RotateCw } from 'lucide-react';
import { tr } from '../../i18n/tr.js';

// Tashqi tizim: Digital Laboratory System (labaratoriya.tris.uz) — admin panel
// ichida ochiladi. Brauzer uchinchi tomon cookie'larini bloklasa, ichkarida
// kirish ishlamasligi mumkin — shuning uchun "Yangi oynada ochish" tugmasi bor.
const DLS_URL = 'https://labaratoriya.tris.uz/';

export default function AdminDls() {
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{tr('DLS tizimi')}</h1>
          <p className="text-sm text-slate-500">Digital Laboratory System — labaratoriya.tris.uz</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setLoaded(false);
              setReloadKey((k) => k + 1);
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RotateCw className="h-4 w-4" /> {tr('Yangilash')}
          </button>
          <a href={DLS_URL} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> {tr('Yangi oynada ochish')}
          </a>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-white">
        {!loaded && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">{tr('Yuklanmoqda...')}</div>}
        <iframe
          key={reloadKey}
          src={DLS_URL}
          title="Digital Laboratory System"
          onLoad={() => setLoaded(true)}
          className="relative h-full w-full border-0"
          referrerPolicy="no-referrer"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  );
}
