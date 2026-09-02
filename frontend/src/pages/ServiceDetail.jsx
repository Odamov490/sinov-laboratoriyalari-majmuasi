import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState, DataUpdatingBadge } from '../components/StateViews.jsx';
import FormattedText from '../components/FormattedText.jsx';
import { getService } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [service, setService] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setService(null);
    setError(false);
    getService(slug).then(setService).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!service) return <Loading />;

  const price = service.prices?.[0];

  const rows = [
    { label: 'Laboratoriya', value: getLocalized(service.laboratory, 'name', i18n.language) },
    { label: 'Sinov obyekti', value: service.testObject || t('common.dataUpdating') },
    { label: 'Sinov turi', value: service.testType || t('common.dataUpdating') },
    { label: 'Standart', value: service.standard?.code || t('common.dataUpdating') },
    { label: 'Bajarilish muddati', value: service.durationDays ? `${service.durationDays} kun` : t('common.dataUpdating') },
    { label: 'Narx', value: price?.amount ? `${Number(price.amount).toLocaleString('uz-UZ')} ${price.currency}` : t('common.dataUpdating') },
  ];

  const description = getLocalized(service, 'description', i18n.language);

  return (
    <div className="section container-page">
      <Breadcrumb
        items={[
          { label: t('nav.services'), to: '/xizmatlar' },
          { label: getLocalized(service, 'name', i18n.language) },
        ]}
      />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
            {getLocalized(service, 'name', i18n.language)}
          </h1>

          {description ? (
            <div className="mt-6 card p-6">
              <FormattedText text={description} />
            </div>
          ) : (
            <div className="mt-4"><DataUpdatingBadge /></div>
          )}

          <div className="mt-8 card divide-y divide-border overflow-hidden">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-slate-500">{r.label}</span>
                <span className="font-medium text-ink text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card p-6 sticky top-24">
            <p className="text-sm text-slate-500">{t('common.apply')}</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">
              {price?.amount ? `${Number(price.amount).toLocaleString('uz-UZ')} ${price.currency}` : t('common.dataUpdating')}
            </p>
            <Link to={`/ariza?serviceId=${service.id}`} className="btn-primary w-full mt-6">
              {t('common.apply')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}