import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, RotateCcw } from 'lucide-react';
import { getSettings } from '../../services/publicApi';
import { updateSettings, uploadFiles } from '../../services/adminApi';
import { Loading } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { tr } from '../../i18n/tr.js';
import { LOGO_URL, FORM_LOGO_KEY, resetFormLogoCache } from './smk/smkDocument.js';

// Sozlamalar -> "Forma logosi": SMK formalari shapkasidagi logo (ekran, Word,
// PDF, chop etish). Hamma formalarda bir xil. Bo'sh bo'lsa — standart logo.
const MAX_MB = 2;
const ACCEPT = '.png,.jpg,.jpeg';

export default function AdminFormLogoSettings() {
  const { showToast } = useToast();
  const [current, setCurrent] = useState(null); // '' = standart
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then((s) => setCurrent(s?.[FORM_LOGO_KEY] || ''))
      .catch(() => setCurrent(''));
  }, []);

  const save = async (value) => {
    await updateSettings({ [FORM_LOGO_KEY]: value });
    resetFormLogoCache();
    setCurrent(value);
  };

  const onFile = async (files) => {
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      showToast(tr('Faqat PNG yoki JPG rasm yuklang.'), 'error');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(tr('Rasm hajmi {0} MB dan oshmasin.', MAX_MB), 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await uploadFiles([file]);
      await save(res.files[0].url);
      showToast(tr('Logo saqlandi.'), 'success');
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setSaving(true);
    try {
      await save('');
      showToast(tr('Standart logo tiklandi.'), 'success');
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (current === null) return <Loading />;
  const src = current || LOGO_URL;

  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-lg font-semibold text-ink">{tr('Forma logosi')}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {tr("SMK formalari shapkasidagi logo — ekranda, Word, PDF va chop etishda. Hamma formalarda bir xil.")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-6">
        <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-border bg-white p-2">
          <img data-testid="form-logo-preview" src={src} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {current ? tr('Hozir: yuklangan logo.') : tr('Hozir: standart logo.')}
          </p>
          <div className="flex flex-wrap gap-2">
            <label className={`btn-primary !py-2.5 cursor-pointer ${saving ? 'pointer-events-none opacity-60' : ''}`}>
              <ImagePlus className="h-4 w-4" /> {saving ? tr('Saqlanmoqda...') : tr('Yangi logo yuklash')}
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files)} disabled={saving} />
            </label>
            {current && (
              <button type="button" onClick={resetToDefault} disabled={saving} className="btn-secondary !py-2.5">
                <RotateCcw className="h-4 w-4" /> {tr('Standart logoga qaytarish')}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {tr("PNG yoki JPG, {0} MB gacha. Kvadrat yoki to'rtburchak — logo proporsiyasi saqlanadi.", MAX_MB)}
          </p>
        </div>
      </div>

      {/* Shapkada qanday ko'rinishi (62×62). */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-ink">{tr("Shapkada ko'rinishi")}</p>
        <table className="w-full border-collapse text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          <tbody>
            <tr>
              <td className="border border-black p-1.5 text-center" style={{ width: 1 }}>
                {/* Proporsiya saqlanadi: balandligi 60, eni 180 gacha (smkDocument.fitLogo). */}
                <img src={src} alt="" style={{ height: 60, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'inline-block' }} />
              </td>
              <td className="border border-black px-3 py-2 text-center text-sm font-bold">{tr('Forma nomi')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
