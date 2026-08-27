import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Pagination } from '../components/UI.jsx';
import { NewsCard } from '../components/Cards.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getNews } from '../services/publicApi';

export default function News() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    getNews({ page, pageSize: 9 }).then(setData).catch(() => setError(true));
  }, [page]);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.news') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.news')}</h1>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {error ? (
          <div className="col-span-full"><ErrorState /></div>
        ) : data === null ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : data.items.length === 0 ? (
          <div className="col-span-full"><EmptyState /></div>
        ) : (
          data.items.map((n) => <NewsCard key={n.id} item={n} />)
        )}
      </div>
      {data && <Pagination page={page} pageSize={9} total={data.total} onChange={setPage} />}
    </div>
  );
}
