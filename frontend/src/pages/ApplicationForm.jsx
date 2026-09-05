import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import FileUploader from '../components/FileUploader.jsx';
import { submitApplication, submitTnVedInquiry, checkTnVedRegulation } from '../services/publicApi';
import { useToast } from '../context/ToastContext.jsx';

export default function ApplicationForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);

  const [tnQuery, setTnQuery] = useState('');
  const sentInquiryKeys = useRef(new Set());

  // --- TN VED conformity-regulation lookup (mandatory cert / declaration) ---
  const [tnRegulation, setTnRegulation] = useState(null); // { matches, hasMandatoryCert, hasDeclaration } | null
  const [tnChecking, setTnChecking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { serviceId: searchParams.get('serviceId') || '' },
  });

  const fullName = watch('fullName');
  const phone = watch('phone');
  const email = watch('email');

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
  // A mandatory-certificate match is a hard stop — this online form cannot
  // be used to continue; there is no "proceed anyway" escape hatch.
  const regulationBlocking = !!mandatoryMatch;

  // Fire the background lead-capture inquiry once contact details are valid
  // and a TN VED code has been entered — captures a lead even if the
  // visitor never submits the full application.
  useEffect(() => {
    const code = tnQuery.trim();
    if (code.length < 2) return;
    if (!fullName || fullName.trim().length < 2) return;
    if (!phone || phone.trim().length < 5) return;

    const key = `${code}|${phone.trim()}`;
    if (sentInquiryKeys.current.has(key)) return;

    const handle = setTimeout(() => {
      sentInquiryKeys.current.add(key);
      submitTnVedInquiry({
        tnVedCode: code,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email || undefined,
      }).catch(() => {
        sentInquiryKeys.current.delete(key);
      });
    }, 900);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tnQuery, fullName, phone]);

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      const payload = {
        ...values,
        tnVedCode: tnQuery.trim() || undefined,
        tnVedWarningShown: !!(mandatoryMatch || declarationMatch),
        tnVedWarningCategory: mandatoryMatch ? 'SERTIFIKAT' : declarationMatch ? 'DEKLARATSIYA' : undefined,
      };
      Object.entries(payload).forEach(([k, v]) => v && formData.append(k, v));
      files.forEach((f) => formData.append('files', f));
      const data = await submitApplication(formData);
      setResult(data);
    } catch (err) {
      showToast(err?.response?.data?.error || t('common.errorLoading'), 'error');
    }
  };

  if (result) {
    return (
      <div className="section container-page max-w-xl text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
        <h1 className="mt-6 text-2xl font-bold text-ink">{t('application.success')}</h1>
        <div className="mt-4 card p-5 inline-flex items-center gap-3">
          <span className="text-sm text-slate-500">{t('application.number')}:</span>
          <span className="font-mono font-bold text-primary">{result.applicationNumber}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.applicationNumber);
              showToast('Nusxalandi', 'success');
            }}
            className="text-slate-400 hover:text-primary"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={`/arizani-tekshirish?n=${result.applicationNumber}`} className="btn-secondary">
            {t('nav.track')}
          </Link>
          <Link to="/" className="btn-primary">
            {t('nav.home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section container-page max-w-2xl">
      <Breadcrumb items={[{ label: t('nav.apply') }]} />
      <h1 className="mt-4 text-3xl font-extrabold text-primary">{t('application.title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {/* TN VED code + optional conformity-requirement check */}
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
                  Ushbu TN VED kodi bo'yicha ariza onlayn tizim orqali qabul qilinmaydi. Aniq talab mahsulotning
                  to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi — sertifikat rasmiylashtirish
                  bo'yicha mutaxassislarimiz bilan bog'laning.
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

        {!regulationBlocking && (
          <>
            <div className="card p-6">
              <p className="text-sm font-semibold text-ink">{t('application.contactTitle')}</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">{t('application.contactHint')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t('application.fullName')} error={errors.fullName}>
                  <input {...register('fullName', { required: true, minLength: 2 })} className="input-field" />
                </Field>
                <Field label={t('application.phone')} error={errors.phone}>
                  <input {...register('phone', { required: true, minLength: 5 })} className="input-field" placeholder="+998" />
                </Field>
                <Field label={`${t('application.email')} (${t('common.optional')})`}>
                  <input {...register('email')} type="email" className="input-field" />
                </Field>
              </div>
            </div>

            <div className="card p-6 space-y-5">
              <Field label={t('application.productName')} error={errors.productName}>
                <input {...register('productName', { required: true })} className="input-field" />
              </Field>

              <Field label={`${t('application.productDescription')} (${t('common.optional')})`}>
                <textarea
                  {...register('productDescription')}
                  rows={3}
                  placeholder={t('application.productDescriptionPlaceholder')}
                  className="input-field resize-none"
                />
              </Field>

              <Field label={t('application.comment')}>
                <textarea {...register('comment')} rows={4} className="input-field resize-none" />
              </Field>

              <Field label={t('application.file')}>
                <FileUploader files={files} onChange={setFiles} />
              </Field>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {t('common.submit')}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">Majburiy maydon</p>}
    </div>
  );
}
