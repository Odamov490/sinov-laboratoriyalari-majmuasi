import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy } from 'lucide-react';
import { Breadcrumb, Select } from '../components/UI.jsx';
import FileUploader from '../components/FileUploader.jsx';
import { getLaboratories, getServices, submitApplication } from '../services/publicApi';
import { getLocalized } from '../utils/localize';
import { useToast } from '../context/ToastContext.jsx';

export default function ApplicationForm() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [labs, setLabs] = useState([]);
  const [services, setServices] = useState([]);
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { serviceId: searchParams.get('serviceId') || '' },
  });

  const laboratoryId = watch('laboratoryId');

  useEffect(() => {
    getLaboratories().then(setLabs).catch(() => {});
  }, []);

  useEffect(() => {
    getServices({ laboratoryId: laboratoryId || undefined, pageSize: 100 })
      .then((d) => setServices(d.items))
      .catch(() => setServices([]));
  }, [laboratoryId]);

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

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={t('application.fullName')} error={errors.fullName}>
            <input {...register('fullName', { required: true })} className="input-field" />
          </Field>
          <Field label={t('application.organization')}>
            <input {...register('organization')} className="input-field" />
          </Field>
          <Field label={t('application.phone')} error={errors.phone}>
            <input {...register('phone', { required: true })} className="input-field" placeholder="+998" />
          </Field>
          <Field label={t('application.email')}>
            <input {...register('email')} type="email" className="input-field" />
          </Field>
          <Field label={t('application.productName')} error={errors.productName}>
            <input {...register('productName', { required: true })} className="input-field" />
          </Field>
          <Field label={t('application.productType')}>
            <input {...register('productType')} className="input-field" />
          </Field>
          <Field label={t('application.laboratory')}>
            <Select
              value={watch('laboratoryId')}
              onChange={(v) => setValue('laboratoryId', v)}
              placeholder="—"
              options={labs.map((l) => ({ value: l.id, label: getLocalized(l, 'name', i18n.language) }))}
            />
          </Field>
          <Field label={t('application.service')}>
            <Select
              value={watch('serviceId')}
              onChange={(v) => setValue('serviceId', v)}
              placeholder="—"
              options={services.map((s) => ({ value: s.id, label: getLocalized(s, 'name', i18n.language) }))}
            />
          </Field>
          <Field label={t('application.testType')}>
            <input {...register('testType')} className="input-field" />
          </Field>
        </div>

        <Field label={t('application.comment')}>
          <textarea {...register('comment')} rows={4} className="input-field resize-none" />
        </Field>

        <Field label={t('application.file')}>
          <FileUploader files={files} onChange={setFiles} />
        </Field>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {t('common.submit')}
        </button>
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
