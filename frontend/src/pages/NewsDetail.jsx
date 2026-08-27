import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState } from '../components/StateViews.jsx';
import { getNewsItem } from '../services/publicApi';
import { getLocalized, formatDate } from '../utils/localize';

export default function NewsDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItem(null);
    setError(false);
    getNewsItem(slug).then(setItem).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!item) return <Loading />;

  return (
    <div className="section container-page max-w-3xl">
      <Breadcrumb items={[{ label: t('nav.news'), to: '/yangiliklar' }, { label: getLocalized(item, 'title', i18n.language) }]} />
      <p className="mt-4 text-sm text-slate-400">{formatDate(item.publishedAt || item.createdAt, i18n.language)}</p>
      <h1 className="mt-2 text-2xl md:text-4xl font-extrabold text-primary leading-tight">
        {getLocalized(item, 'title', i18n.language)}
      </h1>
      {item.image && <img src={item.image} alt="" className="mt-8 w-full rounded-xl border border-border" />}
      <div className="mt-8 prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
        {getLocalized(item, 'content', i18n.language) || getLocalized(item, 'description', i18n.language)}
      </div>
    </div>
  );
}
