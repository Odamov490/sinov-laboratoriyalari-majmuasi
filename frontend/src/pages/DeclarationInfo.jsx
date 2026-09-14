import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, FileText, Eye, Download, ListChecks, KeySquare, CreditCard, FlaskConical } from 'lucide-react';
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
  const guideTitle = getLocalized(page, 'guideTitle', i18n.language);
  const guideContent = getLocalized(page, 'guideContent', i18n.language);

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

      {(page.document502Url || page.document43Url) && (
        <div className="mt-8 card p-6">
          <p className="text-sm font-semibold text-ink">{t('declarationInfo.resolutionsTitle')}</p>
          <div className="mt-3 space-y-3">
            {page.document502Url && (
              <ResolutionDoc number="502" url={page.document502Url} t={t} />
            )}
            {page.document43Url && (
              <ResolutionDoc number="43" url={page.document43Url} t={t} />
            )}
          </div>
        </div>
      )}

      {guideTitle && guideContent && (
        <>
          <hr className="mt-16 border-border" />

          <div className="mt-10 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-primary pt-2">{guideTitle}</h2>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <GuideBadge icon={KeySquare}>{t('declarationInfo.guideBadgeEri')}</GuideBadge>
            <GuideBadge icon={CreditCard}>{t('declarationInfo.guideBadgePayment')}</GuideBadge>
            <GuideBadge icon={FlaskConical} gold>{t('declarationInfo.guideBadgeLab')}</GuideBadge>
          </div>

          <div className="mt-6 card p-6">
            <FormattedText text={guideContent} />
          </div>
        </>
      )}

      <div className="mt-8 card p-6 bg-bg-light flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink">{t('declarationInfo.applyHint')}</p>
        <Link to="/ariza" className="btn-primary shrink-0">
          {t('nav.apply')}
        </Link>
      </div>
    </div>
  );
}

function GuideBadge({ icon: Icon, gold, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        gold ? 'border-accent/50 bg-accent/10 text-[#8A6A17]' : 'border-border bg-bg-light text-slate-600'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function ResolutionDoc({ number, url, t }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-light text-primary">
          <FileText className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-ink truncate">
          {t('tnvedCheck.decisionLabel')} №{number}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={url} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5 !px-3 text-xs">
          <Eye className="h-3.5 w-3.5" /> {t('common.view')}
        </a>
        <a href={url} download className="btn-secondary !py-1.5 !px-3 text-xs">
          <Download className="h-3.5 w-3.5" /> {t('common.download')}
        </a>
      </div>
    </div>
  );
}
