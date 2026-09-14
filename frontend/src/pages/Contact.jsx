import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, Send, Clock, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { Breadcrumb } from '../components/UI.jsx';
import { getSettings, sendContactMessage } from '../services/publicApi';
import { useToast } from '../context/ToastContext.jsx';

const LAB_LAT = 41.3326111;
const LAB_LON = 69.3213086;

export default function Contact() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({});
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
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
      <SEO title={t('nav.contact')} />
      <Breadcrumb items={[{ label: t('nav.contact') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.contact')}</h1>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="card p-5 flex items-start gap-4">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('common.address')}</p>
              <p className="text-sm font-medium text-ink">{val('address')}</p>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-4">
            <Phone className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('common.phone')}</p>
              <p className="text-sm font-medium text-ink">{val('phone')}</p>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-4">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('common.email')}</p>
              <p className="text-sm font-medium text-ink">{val('email')}</p>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-4">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('common.workingHours')}</p>
              <p className="text-sm font-medium text-ink">{val('working_hours')}</p>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-border h-64">
            <iframe
              title="map"
              className="w-full h-full"
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=69.3153086%2C41.3266111%2C69.3273086%2C41.3386111&layer=mapnik&marker=41.3326111%2C69.3213086"
            />

            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMapMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-border shadow-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg-light"
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> {t('common.openInMap')}
              </button>

              {mapMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMapMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-border bg-white shadow-card py-1 z-20">
                    <a
                      href={`https://www.google.com/maps?q=${LAB_LAT},${LAB_LON}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMapMenuOpen(false)}
                      className="block w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-bg-light"
                    >
                      Google Maps
                    </a>
                    <a
                      href={`https://yandex.com/maps/?pt=${LAB_LON},${LAB_LAT}&z=17&l=map`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMapMenuOpen(false)}
                      className="block w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-bg-light"
                    >
                      Yandex Maps
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <input
              {...register('fullName', { required: true })}
              placeholder={t('application.fullName')}
              className="input-field"
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{t('common.requiredField')}</p>}
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
            {errors.message && <p className="text-xs text-red-500 mt-1">{t('common.messageRequired')}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            <Send className="h-4 w-4" /> {t('common.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
