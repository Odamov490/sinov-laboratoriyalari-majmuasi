import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { LaboratoryCard } from '../components/Cards.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getLaboratories } from '../services/publicApi';

export default function Laboratories() {
  const { t } = useTranslation();
  const [labs, setLabs] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getLaboratories()
      .then(setLabs)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.laboratories') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.laboratories')}</h1>
      <p className="section-subtitle">{t('hero.tagline')}</p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {error ? (
          <div className="col-span-full">
            <ErrorState />
          </div>
        ) : labs === null ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : labs.length === 0 ? (
          <div className="col-span-full">
            <EmptyState />
          </div>
        ) : (
          labs.map((lab) => <LaboratoryCard key={lab.id} lab={lab} />)
        )}
      </div>
    </div>
  );
}
