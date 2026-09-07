import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import FileUploader from '../components/FileUploader.jsx';
import { submitApplication } from '../services/publicApi';
import { useToast } from '../context/ToastContext.jsx';

export default function ApplicationForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { serviceId: searchParams.get('serviceId') || '' },
  });

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => v && formData.append(k, v));
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

      <Link
        to="/tnved-tekshirish"
        className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ShieldCheck className="h-4 w-4" />
        {t('application.tnvedCheckHint')}
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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

          <Field label={`${t('application.tnvedLabel')} (${t('common.optional')})`}>
            <input {...register('tnVedCode')} placeholder={t('application.tnvedPlaceholder')} className="input-field" />
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
