import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Search, Loader2, PackageSearch, AlertTriangle, Info } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import FileUploader from '../components/FileUploader.jsx';
import { submitApplication, searchTnVed, submitTnVedInquiry, checkTnVedRegulation } from '../services/publicApi';
import { getLocalized } from '../utils/localize';
import { useToast } from '../context/ToastContext.jsx';

export default function ApplicationForm() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [wasUnmatched, setWasUnmatched] = useState(false);

  // --- TN VED lookup state ---
  const [tnQuery, setTnQuery] = useState('');
  const [tnResults, setTnResults] = useState(null); // null = not searched yet
  const [tnSearching, setTnSearching] = useState(false);
  const [tnDropdownOpen, setTnDropdownOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const sentInquiryKeys = useRef(new Set());

  // --- TN VED conformity-regulation lookup (mandatory cert / declaration) ---
  const [tnRegulation, setTnRegulation] = useState(null); // { matches, hasMandatoryCert, hasDeclaration } | null
  const [regulationAck, setRegulationAck] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { serviceId: searchParams.get('serviceId') || '' },
  });

  const fullName = watch('fullName');
  const phone = watch('phone');
  const email = watch('email');

  // Debounced TN VED search-as-you-type.
  useEffect(() => {
    const q = tnQuery.trim();
    if (q.length < 2) {
      setTnResults(null);
      setTnSearching(false);
      return undefined;
    }
    setTnSearching(true);
    const handle = setTimeout(() => {
      searchTnVed(q)
        .then((d) => setTnResults(d.items))
        .catch(() => setTnResults([]))
        .finally(() => setTnSearching(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [tnQuery]);

  const searchAttempted = tnQuery.trim().length >= 2;
  const notFound = searchAttempted && !selectedCode && !tnSearching && tnResults?.length === 0;
  const tnvedResolved = !!selectedCode || notFound;

  // Debounced conformity-requirement check — approximate, 4-digit HS heading
  // match only (see backend parseTnVedRanges). Re-checks whenever the code
  // changes and resets the "acknowledged" state, so a changed code can't
  // silently ride on a stale acknowledgement.
  useEffect(() => {
    const code = (selectedCode?.code || tnQuery).replace(/\D/g, '');
    setRegulationAck(false);
    if (code.length < 4) {
      setTnRegulation(null);
      return undefined;
    }
    const handle = setTimeout(() => {
      checkTnVedRegulation(code)
        .then(setTnRegulation)
        .catch(() => setTnRegulation(null));
    }, 400);
    return () => clearTimeout(handle);
  }, [tnQuery, selectedCode]);

  const mandatoryMatch = tnRegulation?.matches?.find((m) => m.category === 'SERTIFIKAT');
  const declarationMatch = !mandatoryMatch && tnRegulation?.matches?.find((m) => m.category === 'DEKLARATSIYA');
  const regulationBlocking = !!mandatoryMatch && !regulationAck;

  // Fire the background lead-capture inquiry once contact details are valid,
  // the moment a TN VED search has happened — whether or not it matched.
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
        tnVedCodeId: selectedCode?.id,
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

  const selectCode = (code) => {
    setSelectedCode(code);
    setTnQuery(code.code);
    setTnDropdownOpen(false);
    setValue('productName', getLocalized(code, 'name', i18n.language) || code.nameUz);
  };

  const clearSelection = () => {
    setSelectedCode(null);
    setTnQuery('');
    setTnResults(null);
    setValue('productName', '');
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      const payload = {
        ...values,
        tnVedCode: tnQuery.trim() || undefined,
        tnVedCodeId: selectedCode?.id,
        tnVedWarningShown: !!(mandatoryMatch || declarationMatch),
        tnVedWarningCategory: mandatoryMatch ? 'SERTIFIKAT' : declarationMatch ? 'DEKLARATSIYA' : undefined,
      };
      Object.entries(payload).forEach(([k, v]) => v && formData.append(k, v));
      files.forEach((f) => formData.append('files', f));
      const data = await submitApplication(formData);
      setWasUnmatched(!selectedCode);
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
        {wasUnmatched && (
          <p className="mt-3 text-sm text-slate-600 max-w-md mx-auto">{t('application.unmatchedSuccessNote')}</p>
        )}
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
        {/* Step 1: TN VED lookup */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-ink mb-1.5">{t('application.tnvedLabel')}</label>
          {selectedCode ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">{t('application.tnvedSelectedTitle')}</p>
                  <p className="font-mono text-sm text-primary font-semibold">{selectedCode.code}</p>
                  <p className="font-medium text-ink">{getLocalized(selectedCode, 'name', i18n.language) || selectedCode.nameUz}</p>
                </div>
                <button type="button" onClick={clearSelection} className="text-xs text-slate-500 hover:text-primary underline shrink-0">
                  {t('application.tnvedChange')}
                </button>
              </div>
              {selectedCode.services?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-slate-500 mb-1.5">{t('application.tnvedTestProgram')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCode.services.map((s) => (
                      <span key={s.id} className="inline-flex rounded-full bg-white border border-primary/20 px-2.5 py-1 text-xs text-ink">
                        {getLocalized(s, 'name', i18n.language) || s.nameUz}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={tnQuery}
                onChange={(e) => {
                  setTnQuery(e.target.value);
                  setTnDropdownOpen(true);
                }}
                onFocus={() => setTnDropdownOpen(true)}
                onBlur={() => setTimeout(() => setTnDropdownOpen(false), 150)}
                placeholder={t('application.tnvedPlaceholder')}
                className="input-field !pl-10"
              />
              {tnSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
              )}
              {tnDropdownOpen && searchAttempted && !tnSearching && tnResults?.length > 0 && (
                <div className="absolute z-20 mt-1.5 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-white py-1.5 shadow-2xl">
                  {tnResults.map((code) => (
                    <button
                      key={code.id}
                      type="button"
                      onMouseDown={() => selectCode(code)}
                      className="block w-full px-3.5 py-2.5 text-left hover:bg-bg-light"
                    >
                      <span className="font-mono text-sm text-primary font-semibold">{code.code}</span>
                      <span className="block text-sm text-ink">{getLocalized(code, 'name', i18n.language) || code.nameUz}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {notFound && (
            <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <PackageSearch className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">{t('application.tnvedNoResults')}</p>
                <p className="text-xs text-amber-700 mt-0.5">{t('application.tnvedNoResultsHint')}</p>
              </div>
            </div>
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
                  Aniq talab mahsulotning to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi. Yakuniy
                  ma'lumot uchun mutaxassislarimiz bilan bog'laning.
                </p>
                {!regulationAck && (
                  <button
                    type="button"
                    onClick={() => setRegulationAck(true)}
                    className="btn-secondary !border-red-600 !text-red-700 hover:!bg-red-100 mt-3 !py-2 !px-4 text-xs"
                  >
                    Tushundim, davom etaman
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!mandatoryMatch && declarationMatch && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Ma'lumot: bu TN VED kodi bo'yicha muvofiqlik deklaratsiyasi rasmiylashtirilishi tavsiya etiladi (
                  {declarationMatch.decision}-son qaror, {declarationMatch.item}-band).
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Aniq talab mahsulotning to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi. Yakuniy
                  ma'lumot uchun mutaxassislarimiz bilan bog'laning.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: contact capture — shown right after a search happens, captured as a lead in the background */}
        {searchAttempted && !regulationBlocking && (
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
        )}

        {/* Step 3: rest of the form, once TN VED lookup is resolved (matched or confirmed not-found) */}
        {tnvedResolved && !regulationBlocking && (
          <div className="card p-6 space-y-5">
            <Field label={t('application.productName')} error={errors.productName}>
              <input {...register('productName', { required: true })} className="input-field" />
            </Field>

            {notFound && (
              <Field label={t('application.productDescription')} error={errors.productDescription}>
                <textarea
                  {...register('productDescription', { required: notFound, minLength: 5 })}
                  rows={3}
                  placeholder={t('application.productDescriptionPlaceholder')}
                  className="input-field resize-none"
                />
              </Field>
            )}

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
