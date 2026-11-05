import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Upload, Eye, EyeOff, Smile } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { Navigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../components/Modal.jsx';
import { Loading } from '../../../components/StateViews.jsx';
import chatApi, { apiError } from '../../../chat/chatApi';
import { tr } from '../../../i18n/tr.js';

// /admin/stikerlar (SUPER_ADMIN): to'plamlar va stikerlar.
// PNG/WebP/GIF/SVG, har biri <= 512 KB. Xavfli SVG server tomonidan rad etiladi.
const MAX = 512 * 1024;
const ACCEPT = 'image/png,image/webp,image/gif,image/svg+xml,.svg';

function PackCard({ pack, onChanged, toast }) {
  const [title, setTitle] = useState(pack.title);
  const [emoji, setEmoji] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const input = useRef(null);

  const run = async (fn, ok) => {
    try {
      await fn();
      if (ok) toast(ok, 'success');
      onChanged();
    } catch (err) {
      toast(apiError(err), 'error');
    }
  };

  const upload = async (files) => {
    const good = files.filter((f) => f.size <= MAX);
    if (good.length < files.length) toast(tr("{0} ta fayl 512 KB dan katta — o'tkazib yuborildi.", files.length - good.length), 'error');
    if (!good.length) return;
    const form = new FormData();
    good.forEach((f) => form.append('files', f, f.name));
    if (emoji.trim()) form.append('emoji', emoji.trim());
    setBusy(true);
    try {
      const r = await chatApi.addStickers(pack.id, form);
      toast(tr("{0} ta stiker qo'shildi{1}.", r.added.length, r.rejected.length ? tr(', {0} ta rad etildi ({1})', r.rejected.length, r.rejected[0].reason) : ''), r.rejected.length ? 'error' : 'success');
      onChanged();
    } catch (err) {
      toast(apiError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="input-field !w-auto flex-1 !py-2" />
        {title !== pack.title && (
          <button type="button" onClick={() => run(() => chatApi.updatePack(pack.id, { title }), tr('Saqlandi.'))} className="btn-primary !px-3 !py-2">
            {tr('Saqlash')}
          </button>
        )}
        <button
          type="button"
          onClick={() => run(() => chatApi.updatePack(pack.id, { isActive: !pack.isActive }))}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${pack.isActive ? 'border-emerald-300 text-emerald-700' : 'border-slate-300 text-slate-500'}`}
        >
          {pack.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} {pack.isActive ? tr('Faol') : tr('Yashirin')}
        </button>
        <button type="button" onClick={() => setConfirm({ kind: 'pack' })} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title={tr("To'plamni o'chirish")}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-8">
        {pack.stickers.map((s) => (
          <div key={s.id} className="group relative rounded-lg border border-border p-2">
            <img src={s.url} alt={s.emoji || ''} className="mx-auto h-16 w-16 object-contain" loading="lazy" />
            <input
              defaultValue={s.emoji || ''}
              maxLength={16}
              placeholder="emoji"
              onBlur={(e) => e.target.value !== (s.emoji || '') && run(() => chatApi.updateSticker(s.id, { emoji: e.target.value }))}
              className="mt-1 w-full rounded border border-border px-1 py-0.5 text-center text-xs"
            />
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'sticker', id: s.id })}
              className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 opacity-0 shadow group-hover:opacity-100"
              title={tr("O'chirish")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-primary hover:text-primary"
        >
          <Upload className="h-5 w-5" /> {busy ? tr('Yuklanmoqda…') : tr("Qo'shish")}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Smile className="h-4 w-4" /> {tr('Yangi stikerlar uchun emoji (ixtiyoriy):')}
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={16} className="w-16 rounded border border-border px-1 py-0.5 text-center" />
        <span>{tr("· PNG, WebP, GIF, SVG — har biri ko'pi bilan 512 KB")}</span>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const files = [...e.target.files];
          e.target.value = '';
          upload(files);
        }}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={tr("O'chirish")}
        message={confirm?.kind === 'pack' ? tr("To'plam va undagi barcha stikerlar o'chiriladi. Yuborilgan stikerli xabarlar bo'sh ko'rinadi.") : tr("Stiker o'chiriladi.")}
        onConfirm={() => run(() => (confirm.kind === 'pack' ? chatApi.deletePack(pack.id) : chatApi.deleteSticker(confirm.id)), tr("O'chirildi."))}
      />
    </div>
  );
}

export default function AdminStickers({ embedded = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [packs, setPacks] = useState(null);
  const [title, setTitle] = useState('');

  const load = () =>
    chatApi
      .stickers(true)
      .then((r) => setPacks(r.items))
      .catch((err) => {
        showToast(apiError(err), 'error');
        setPacks([]);
      });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {!embedded && <h1 className="text-2xl font-bold text-ink">{tr('Stikerlar')}</h1>}
          <p className="text-sm text-slate-500">{tr("Chatdagi stiker to'plamlari. Yashirin to'plam foydalanuvchilarga ko'rinmaydi.")}</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await chatApi.createPack(title.trim());
              setTitle('');
              load();
            } catch (err) {
              showToast(apiError(err), 'error');
            }
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder={tr("Yangi to'plam nomi")} className="input-field !py-2" />
          <button className="btn-primary !py-2" disabled={!title.trim()}>
            <Plus className="h-4 w-4" /> {tr('Yaratish')}
          </button>
        </form>
      </div>
      {!packs ? <Loading /> : packs.length === 0 ? <p className="text-sm text-slate-500">{tr("To'plam yo'q.")}</p> : packs.map((p) => <PackCard key={p.id} pack={p} onChanged={load} toast={showToast} />)}
    </div>
  );
}
