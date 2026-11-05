import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ImagePlus, Settings, SlidersHorizontal, Smile, Trash2 } from 'lucide-react';
import { getSettings } from '../../services/publicApi';
import { updateSettings, uploadFiles } from '../../services/adminApi';
import { Loading } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { tr } from '../../i18n/tr.js';
import {
  DEFAULT_HERO_INTERVAL,
  MAX_HERO_SLIDES,
  isHeroImageFile,
  parseHeroInterval,
  parseHeroSlides,
} from '../../utils/heroSlides.js';

const FIELDS = [
  { key: 'org_name', label: tr('Tashkilot nomi') },
  { key: 'phone', label: tr('Telefon') },
  { key: 'email', label: 'Email' },
  { key: 'address', label: tr('Manzil') },
  { key: 'working_hours', label: tr('Ish vaqti') },
  { key: 'telegram', label: tr('Telegram havolasi') },
  { key: 'instagram', label: tr('Instagram havolasi') },
];

const AdminChatSettings = lazy(() => import('./chat/AdminChatSettings.jsx'));
const AdminStickers = lazy(() => import('./chat/AdminStickers.jsx'));

// Yorliq havolada: ?tab=umumiy|chat|stikerlar
// (eski /admin/chat-sozlamalari va /admin/stikerlar shu yerga yo'naltiriladi).
const TABS = [
  { key: 'umumiy', label: tr('Umumiy'), icon: Settings },
  { key: 'chat', label: tr('Chat sozlamalari'), icon: SlidersHorizontal, superOnly: true },
  { key: 'stikerlar', label: tr('Stikerlar'), icon: Smile, superOnly: true },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  // Chat sozlamalari va stikerlar — faqat SUPER_ADMIN uchun.
  const tabs = TABS.filter((t) => !t.superOnly || user?.role === 'SUPER_ADMIN');
  const tab = tabs.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'umumiy';

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-2xl font-bold text-ink">{tr('Sozlamalar')}</h1>

      <div className="-mx-1 overflow-x-auto border-b border-border" role="tablist">
        <div className="flex min-w-max gap-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'umumiy' && <GeneralSettings />}
      <Suspense fallback={<Loading />}>
        {tab === 'chat' && <AdminChatSettings embedded />}
        {tab === 'stikerlar' && <AdminStickers embedded />}
      </Suspense>
    </div>
  );
}

function GeneralSettings() {
  const { showToast } = useToast();
  const [values, setValues] = useState(null);
  const [slides, setSlides] = useState([]);
  const [interval, setIntervalSec] = useState(DEFAULT_HERO_INTERVAL);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then((v) => {
        setValues(v || {});
        setSlides(parseHeroSlides(v?.hero_slides));
        setIntervalSec(parseHeroInterval(v?.hero_slide_interval ?? DEFAULT_HERO_INTERVAL));
      })
      .catch(() => setValues({}));
  }, []);

  const addImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    if (files.some((f) => !isHeroImageFile(f))) {
      showToast(tr('Faqat JPG, PNG yoki WEBP rasm yuklash mumkin.'), 'error');
      return;
    }
    const room = MAX_HERO_SLIDES - slides.length;
    if (room <= 0) {
      showToast(tr('Ko\'pi bilan {0} ta rasm qo\'yish mumkin.', MAX_HERO_SLIDES), 'error');
      return;
    }
    const batch = files.slice(0, room);
    setUploading(true);
    try {
      const urls = [];
      // Server bir so'rovda 5 tagacha fayl qabul qiladi.
      for (let i = 0; i < batch.length; i += 5) {
        const res = await uploadFiles(batch.slice(i, i + 5));
        urls.push(...(res.files || []).map((f) => f.url));
      }
      setSlides((s) => [...s, ...urls].slice(0, MAX_HERO_SLIDES));
      if (files.length > room) showToast(tr('Ko\'pi bilan {0} ta rasm qo\'yish mumkin.', MAX_HERO_SLIDES), 'error');
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const move = (i, d) =>
    setSlides((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const removeAt = (i) => setSlides((s) => s.filter((_, k) => k !== i));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        hero_slides: JSON.stringify(slides),
        hero_slide_interval: String(parseHeroInterval(interval)),
      };
      const saved = await updateSettings(payload);
      setValues((v) => ({ ...v, ...saved }));
      showToast(tr('Sozlamalar saqlandi.'), 'success');
    } catch {
      showToast(tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!values) return <Loading />;

  return (
    <div className="max-w-xl">
      <div className="card p-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-ink mb-1.5">{f.label}</label>
            <input
              value={values[f.key] || ''}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="input-field"
            />
          </div>
        ))}
      </div>

      <div className="card p-6 mt-6">
        <h2 className="font-semibold text-ink">{tr('Bosh sahifa fon rasmlari')}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {tr('Rasmlar bosh sahifaning yuqori qismida navbat bilan chapdan o\'ngga almashib turadi. Tavsiya: 1920×800 px, JPG yoki WEBP. Rasm yo\'q bo\'lsa, avvalgi naqshli fon ko\'rsatiladi.')}
        </p>

        {slides.length > 0 && (
          <ul className="mt-4 space-y-2">
            {slides.map((src, i) => (
              <li key={`${src}-${i}`} className="flex items-center gap-3 rounded-lg border border-border p-2">
                <span className="w-5 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
                <img src={src} alt="" className="h-14 w-28 shrink-0 rounded object-cover bg-slate-100" loading="lazy" />
                <span className="flex-1 truncate text-xs text-slate-500">{src.split('/').pop()}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-slate-400 hover:text-primary disabled:opacity-30" aria-label={tr('Yuqoriga')}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="p-1.5 text-slate-400 hover:text-primary disabled:opacity-30" aria-label={tr('Pastga')}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeAt(i)} className="p-1.5 text-slate-400 hover:text-red-500" aria-label={tr('O\'chirish')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || slides.length >= MAX_HERO_SLIDES}
          className="btn-secondary w-full mt-4"
        >
          <ImagePlus className="h-4 w-4" /> {uploading ? tr('Yuklanmoqda...') : tr('Rasm qo\'shish')}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => addImages(e.target.files)}
        />
        <p className="mt-1.5 text-xs text-slate-400">{tr('{0} / {1} ta rasm', slides.length, MAX_HERO_SLIDES)}</p>

        <div className="mt-4">
          <label htmlFor="hero-interval" className="block text-sm font-medium text-ink mb-1.5">
            {tr('Almashish oralig\'i (soniya)')}
          </label>
          <input
            id="hero-interval"
            type="number"
            min={3}
            max={30}
            value={interval}
            onChange={(e) => setIntervalSec(e.target.value)}
            onBlur={() => setIntervalSec(parseHeroInterval(interval))}
            className="input-field w-32"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{tr('O\'zgarishlar «Saqlash» tugmasi bosilgandan keyin saytda ko\'rinadi.')}</p>
      <button onClick={save} disabled={saving || uploading} className="btn-primary w-full mt-2">
        {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
      </button>
    </div>
  );
}
