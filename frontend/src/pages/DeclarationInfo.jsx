import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState } from '../components/StateViews.jsx';
import FormattedText from '../components/FormattedText.jsx';
import { getInfoPage } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function DeclarationInfo() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getInfoPage('deklaratsiya-va-sertifikat')
      .then(setPage)
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!page) return <Loading />;

  const title = getLocalized(page, 'title', i18n.language);
  const content = getLocalized(page, 'content', i18n.language);

  return (
    <div className="section container-page max-w-3xl">
      <SEO title={title} description={t('declarationInfo.subtitle')} />
      <Breadcrumb items={[{ label: t('nav.declarationInfo') }]} />

      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('declarationInfo.subtitle')}</p>
        </div>
      </div>

      <div className="mt-8 card p-6">
        <FormattedText text={content} />
      </div>

      <div className="mt-8 card p-6 bg-bg-light flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink">{t('declarationInfo.applyHint')}</p>
        <Link to="/ariza" className="btn-primary shrink-0">
          {t('nav.apply')}
        </Link>
      </div>
    </div>
  );
}
