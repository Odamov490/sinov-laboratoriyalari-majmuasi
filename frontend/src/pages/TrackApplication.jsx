import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Breadcrumb, StatusBadge } from '../components/UI.jsx';
import { Loading, EmptyState } from '../components/StateViews.jsx';
import { trackApplication, trackApplicationsByPhone } from '../services/publicApi';
import { formatDate } from '../utils/localize';

export default function TrackApplication() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('n') ? 'number' : 'phone');

  const [number, setNumber] = useState(searchParams.get('n') || '');
  const [phone, setPhone] = useState('');

  const [result, setResult] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const searchByNumber = (n) => {
    if (!n) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    trackApplication(n)
      .then(setResult)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  const searchByPhone = (p) => {
    if (!p) return;
    setLoading(true);
    setNotFound(false);
    setResults(null);
    trackApplicationsByPhone(p)
      .then((d) => {
        setResults(d.items);
        if (d.items.length === 0) setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (searchParams.get('n')) searchByNumber(searchParams.get('n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (m) => {
    setMode(m);
    setResult(null);
    setResults(null);
    setNotFound(false);
  };

  return (
    <div className="section container-page max-w-xl">
      <Breadcrumb items={[{ label: t('nav.track') }]} />
      <h1 className="mt-4 text-3xl font-extrabold text-primary">{t('track.title')}</h1>

      <div className="mt-6 inline-flex rounded-lg border border-border p-1 bg-bg-light">
        <button
          onClick={() => switchMode('phone')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
          }`}
        >
          {t('track.byPhone')}
        </button>
        <button
          onClick={() => switchMode('number')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === 'number' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
          }`}
        >
          {t('track.byNumber')}
        </button>
      </div>

      {mode === 'phone' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchByPhone(phone);
          }}
          className="mt-4 flex gap-3"
        >
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('track.phonePlaceholder')}
            className="input-field"
          />
          <button type="submit" className="btn-primary shrink-0">
            <Search className="h-4 w-4" /> {t('track.button')}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchByNumber(number);
          }}
          className="mt-4 flex gap-3"
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
      )}

      <div className="mt-8 space-y-4">
        {loading && <Loading />}
        {notFound && <EmptyState message={mode === 'phone' ? t('track.noResultsPhone') : t('common.notFound')} />}

        {mode === 'number' && result && <ApplicationCard item={result} t={t} i18n={i18n} />}

        {mode === 'phone' &&
          results?.map((item) => <ApplicationCard key={item.applicationNumber} item={item} t={t} i18n={i18n} />)}
      </div>
    </div>
  );
}

function ApplicationCard({ item, t, i18n }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-primary">{item.applicationNumber}</span>
        <StatusBadge status={item.status} />
      </div>
      <Row label={t('common.date')} value={formatDate(item.date, i18n.language)} />
      <Row label={t('application.fullName')} value={item.client} />
      <Row label={t('application.productName')} value={item.productName} />
      <Row label={t('application.laboratory')} value={item.laboratory} />
      <Row label={t('application.service')} value={item.service} />
      {item.statusComment && <Row label={t('application.comment')} value={item.statusComment} />}
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
