import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { DocumentCard } from '../components/Cards.jsx';
import { Loading, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getDocuments } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function Documents() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDocuments().then(setItems).catch(() => setError(true));
  }, []);

  const grouped = React.useMemo(() => {
    if (!items) return {};
    return items.reduce((acc, doc) => {
      const key = doc.category ? getLocalized(doc.category, 'name', i18n.language) : 'Boshqa';
      acc[key] = acc[key] || [];
      acc[key].push(doc);
      return acc;
    }, {});
  }, [items, i18n.language]);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.documents') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.documents')}</h1>

      <div className="mt-10">
        {error ? (
          <ErrorState />
        ) : items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          Object.entries(grouped).map(([cat, docs]) => (
            <div key={cat} className="mb-10">
              <h2 className="font-semibold text-ink mb-4">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {docs.map((d) => (
                  <DocumentCard key={d.id} doc={d} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
