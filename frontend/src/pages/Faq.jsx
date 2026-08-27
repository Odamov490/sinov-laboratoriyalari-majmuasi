import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getFaq } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function Faq() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFaq().then(setItems).catch(() => setError(true));
  }, []);

  return (
    <div className="section container-page max-w-3xl">
      <Breadcrumb items={[{ label: t('nav.faq') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.faq')}</h1>

      <div className="mt-10 space-y-3">
        {error ? (
          <ErrorState />
        ) : items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((f) => (
            <details key={f.id} className="card p-5 group">
              <summary className="cursor-pointer font-medium text-ink list-none flex justify-between items-center">
                {getLocalized(f, 'question', i18n.language)}
                <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {getLocalized(f, 'answer', i18n.language)}
              </p>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
