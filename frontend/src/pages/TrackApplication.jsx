import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Breadcrumb, StatusBadge } from '../components/UI.jsx';
import { Loading, EmptyState } from '../components/StateViews.jsx';
import { trackApplication } from '../services/publicApi';
import { formatDate } from '../utils/localize';

export default function TrackApplication() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState(searchParams.get('n') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const search = (n) => {
    if (!n) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    trackApplication(n)
      .then(setResult)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (searchParams.get('n')) search(searchParams.get('n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="section container-page max-w-xl">
      <Breadcrumb items={[{ label: t('nav.track') }]} />
      <h1 className="mt-4 text-3xl font-extrabold text-primary">{t('track.title')}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(number);
        }}
        className="mt-8 flex gap-3"
      >
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={t('track.placeholder')}
          className="input-field"
        />
        <button type="submit" className="btn-primary shrink-0">
          <Search className="h-4 w-4" /> {t('track.button')}
        </button>
      </form>

      <div className="mt-8">
        {loading && <Loading />}
        {notFound && <EmptyState message={t('common.notFound')} />}
        {result && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary">{result.applicationNumber}</span>
              <StatusBadge status={result.status} />
            </div>
            <Row label={t('common.date')} value={formatDate(result.date, i18n.language)} />
            <Row label={t('application.fullName')} value={result.client} />
            <Row label={t('application.laboratory')} value={result.laboratory} />
            <Row label={t('application.service')} value={result.service} />
            {result.statusComment && <Row label={t('application.comment')} value={result.statusComment} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ink text-right">{value}</span>
    </div>
  );
}
