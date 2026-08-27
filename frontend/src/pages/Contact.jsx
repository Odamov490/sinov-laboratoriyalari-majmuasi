import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, Send, Clock } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { getSettings, sendContactMessage } from '../services/publicApi';
import { useToast } from '../context/ToastContext.jsx';

export default function Contact() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({});
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const onSubmit = async (values) => {
    try {
      await sendContactMessage(values);
      showToast(t('common.send') + ' ✓', 'success');
      reset();
    } catch {
      showToast(t('common.errorLoading'), 'error');
    }
  };

  const val = (key) => settings[key] || t('common.dataUpdating');

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.contact') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.contact')}</h1>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="card p-5 flex items-start gap-4">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Manzil</p>
              <p className="text-sm font-medium text-ink">{val('address')}</p>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-4">
            <Phone className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Telefon</p>
              <p className="text-sm font-medium text-ink">{val('phone')}</p>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-4">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
              <p className="text-sm font-medium text-ink">{val('email')}</p>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-4">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Ish vaqti</p>
              <p className="text-sm font-medium text-ink">{val('working_hours')}</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-border h-64">
            <iframe
              title="map"
              className="w-full h-full"
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=69.20%2C41.28%2C69.32%2C41.36&layer=mapnik"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <input
              {...register('fullName', { required: true })}
              placeholder={t('application.fullName')}
              className="input-field"
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">Majburiy maydon</p>}
          </div>
          <input {...register('phone')} placeholder={t('application.phone')} className="input-field" />
          <input {...register('email')} placeholder={t('application.email')} className="input-field" />
          <div>
            <textarea
              {...register('message', { required: true, minLength: 3 })}
              rows={5}
              placeholder={t('application.comment')}
              className="input-field resize-none"
            />
            {errors.message && <p className="text-xs text-red-500 mt-1">Xabar matnini kiriting</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            <Send className="h-4 w-4" /> {t('common.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
