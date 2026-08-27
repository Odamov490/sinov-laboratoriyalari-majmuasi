import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState, DataUpdatingBadge } from '../components/StateViews.jsx';
import { getEquipmentItem } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function EquipmentDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItem(null);
    setError(false);
    getEquipmentItem(slug).then(setItem).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!item) return <Loading />;

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.equipment'), to: '/uskunalar' }, { label: item.name }]} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="h-72 rounded-xl bg-bg-light overflow-hidden flex items-center justify-center">
          {item.photo ? (
            <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <FlaskConical className="h-16 w-16 text-primary/20" />
          )}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary">{item.name}</h1>
          {item.laboratory && (
            <p className="mt-1 text-secondary text-sm font-medium">{getLocalized(item.laboratory, 'name', i18n.language)}</p>
          )}
          <div className="mt-6 card divide-y divide-border">
            <Row label="Ishlab chiqaruvchi" value={item.manufacturer} t={t} />
            <Row label="Model" value={item.model} t={t} />
          </div>
          {item.specifications ? (
            <div className="mt-6">
              <h3 className="font-semibold text-ink">Texnik xususiyatlari</h3>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{item.specifications}</p>
            </div>
          ) : (
            <div className="mt-6"><DataUpdatingBadge /></div>
          )}
          {item.application && (
            <div className="mt-6">
              <h3 className="font-semibold text-ink">Qo‘llanilishi</h3>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{item.application}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, t }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ink">{value || t('common.dataUpdating')}</span>
    </div>
  );
}
