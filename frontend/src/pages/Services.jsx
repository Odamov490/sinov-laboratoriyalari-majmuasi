import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, SearchBar, Select, Pagination } from '../components/UI.jsx';
import { ServiceCard } from '../components/Cards.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getServices, getLaboratories } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function Services() {
  const { t, i18n } = useTranslation();
  const [labs, setLabs] = useState([]);
  const [q, setQ] = useState('');
  const [laboratoryId, setLaboratoryId] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getLaboratories().then(setLabs).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    setError(false);
    const handle = setTimeout(() => {
      getServices({ q: q || undefined, laboratoryId: laboratoryId || undefined, page, pageSize: 9 })
        .then(setData)
        .catch(() => setError(true));
    }, 300);
    return () => clearTimeout(handle);
  }, [q, laboratoryId, page]);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.services') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.services')}</h1>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <Select
          value={laboratoryId}
          onChange={(v) => { setLaboratoryId(v); setPage(1); }}
          placeholder={t('nav.laboratories')}
          options={labs.map((l) => ({ value: l.id, label: getLocalized(l, 'name', i18n.language) }))}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {error ? (
          <div className="col-span-full"><ErrorState /></div>
        ) : data === null ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : data.items.length === 0 ? (
          <div className="col-span-full"><EmptyState /></div>
        ) : (
          data.items.map((s) => <ServiceCard key={s.id} service={s} />)
        )}
      </div>

      {data && <Pagination page={page} pageSize={9} total={data.total} onChange={setPage} />}
    </div>
  );
}
