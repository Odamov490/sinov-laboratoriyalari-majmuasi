import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { StaffCard } from '../components/Cards.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getStaff } from '../services/publicApi';

export default function Staff() {
  const { t } = useTranslation();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStaff().then(setItems).catch(() => setError(true));
  }, []);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.staff') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.staff')}</h1>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {error ? (
          <div className="col-span-full"><ErrorState /></div>
        ) : items === null ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : items.length === 0 ? (
          <div className="col-span-full"><EmptyState /></div>
        ) : (
          items.map((s) => <StaffCard key={s.id} person={s} />)
        )}
      </div>
    </div>
  );
}
