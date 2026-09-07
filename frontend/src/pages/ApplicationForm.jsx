import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { checkTnVedRegulation } from '../services/publicApi';

export default function ApplicationForm() {
  const { t } = useTranslation();
  const [tnQuery, setTnQuery] = useState('');

  // --- TN VED conformity-regulation lookup (mandatory cert / declaration) ---
  const [tnRegulation, setTnRegulation] = useState(null); // { matches, hasMandatoryCert, hasDeclaration } | null
  const [tnChecking, setTnChecking] = useState(false);

  // Approximate conformity-requirement check (4-digit HS heading match only
  // — see backend parseTnVedRanges), fired automatically as the code is
  // typed. A changed code always clears the previous result first, so a
  // stale banner never lingers on top of a code it no longer matches.
  useEffect(() => {
    const code = tnQuery.replace(/\D/g, '');
    setTnRegulation(null);
    if (code.length < 4) {
      setTnChecking(false);
      return undefined;
    }
    setTnChecking(true);
    const handle = setTimeout(() => {
      checkTnVedRegulation(code)
        .then(setTnRegulation)
        .catch(() => setTnRegulation(null))
        .finally(() => setTnChecking(false));
    }, 450);
    return () => clearTimeout(handle);
  }, [tnQuery]);

  const mandatoryMatch = tnRegulation?.matches?.find((m) => m.category === 'SERTIFIKAT');
  const declarationMatch = !mandatoryMatch && tnRegulation?.matches?.find((m) => m.category === 'DEKLARATSIYA');
  const checkedNoMatch = !tnChecking && tnRegulation && !mandatoryMatch && !declarationMatch;

  return (
    <div className="section container-page max-w-2xl">
      <Breadcrumb items={[{ label: t('nav.apply') }]} />
      <h1 className="mt-4 text-3xl font-extrabold text-primary">{t('application.title')}</h1>

      <div className="mt-8 space-y-5">
        {/* TN VED code + conformity-requirement check */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-ink mb-1.5">{t('application.tnvedLabel')}</label>
          <input
            value={tnQuery}
            onChange={(e) => setTnQuery(e.target.value)}
            placeholder={t('application.tnvedPlaceholder')}
            className="input-field"
          />

          {tnChecking && (
            <p className="mt-3 pt-3 border-t border-border text-xs text-slate-400 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tekshirilmoqda...
            </p>
          )}
        </div>

        {/* TN VED conformity-requirement notice — approximate, HS-heading-level match */}
        {mandatoryMatch && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Diqqat! Kiritilgan TN VED kodi bo'yicha O'zbekiston Respublikasi Vazirlar Mahkamasining{' '}
                  {mandatoryMatch.decision}-son qarori asosida MAJBURIY MUVOFIQLIK SERTIFIKATI rasmiylashtirilishi
                  lozim (band: {mandatoryMatch.item}, {mandatoryMatch.nameUz}).
                </p>
                <p className="text-xs text-red-700 mt-2">
                  Aniq talab mahsulotning to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi — sertifikat
                  rasmiylashtirish bo'yicha mutaxassislarimiz bilan bog'laning.
                </p>
              </div>
            </div>
          </div>
        )}

        {!mandatoryMatch && declarationMatch && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Ma'lumot: kiritilgan TN VED kodi bo'yicha O'zbekiston Respublikasi Vazirlar Mahkamasining{' '}
                  {declarationMatch.decision}-son qarori asosida MUVOFIQLIK DEKLARATSIYASI rasmiylashtirilishi
                  tavsiya etiladi (band: {declarationMatch.item}, {declarationMatch.nameUz}).
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  Aniq talab mahsulotning to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi. Yakuniy
                  ma'lumot uchun mutaxassislarimiz bilan bog'laning.
                </p>
              </div>
            </div>
          </div>
        )}

        {checkedNoMatch && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Ushbu TN VED kodi bo'yicha maxsus muvofiqlik talabi (sertifikat yoki deklaratsiya) topilmadi.
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  Aniq talab mahsulotning to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi. Yakuniy
                  ma'lumot uchun mutaxassislarimiz bilan bog'laning.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
