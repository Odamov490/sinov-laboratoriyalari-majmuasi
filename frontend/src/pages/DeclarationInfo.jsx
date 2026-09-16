import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ListChecks,
  KeySquare,
  CreditCard,
  FlaskConical,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState } from '../components/StateViews.jsx';
import DeclarationComparison from '../components/DeclarationComparison.jsx';
import GuideTimeline from '../components/GuideTimeline.jsx';
import { getInfoPage, checkTnVedRegulation } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

const SLUG = 'deklaratsiya-va-sertifikat';

export default function DeclarationInfo() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getInfoPage(SLUG).then(setPage).catch(() => setError(true));
  }, []);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!page) return <Loading />;

  const title = getLocalized(page, 'title', i18n.language);
  const intro = getLocalized(page, 'content', i18n.language);
  const guideTitle = getLocalized(page, 'guideTitle', i18n.language);
  const guideContent = getLocalized(page, 'guideContent', i18n.language);
  const declarationValues = getLocalized(page, 'comparisonDeclaration', i18n.language);
  const certificateValues = getLocalized(page, 'comparisonCertificate', i18n.language);
  const faq = getLocalized(page, 'faq', i18n.language);
  const faqItems = parseFaq(faq);

  return (
    <div>
      <SEO title={title} description={intro} />

      {/* HERO */}
      <div className="bg-primary py-14 md:py-20">
        <div className="container-page">
          <Breadcrumb items={[{ label: t('nav.declarationInfo') }]} />
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-white max-w-3xl leading-tight">{title}</h1>
          <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">{intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/tnved-tekshirish" className="btn-accent">
              {t('declarationInfo.heroCheckTnVedCta')}
            </Link>
            <Link
              to="/ariza"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t('nav.apply')}
            </Link>
          </div>
        </div>
      </div>

      {/* STICKY SUB-NAV */}
      <div className="sticky top-16 z-20 bg-white border-b border-border shadow-sm">
        <div className="container-page flex gap-6 text-sm font-medium text-slate-500 overflow-x-auto">
          <a href="#farqi" className="py-3 whitespace-nowrap hover:text-primary transition-colors">
            {t('declarationInfo.sectionComparisonLabel')}
          </a>
          <a href="#qollanma" className="py-3 whitespace-nowrap hover:text-primary transition-colors">
            {t('declarationInfo.sectionGuideLabel')}
          </a>
          {faqItems.length > 0 && (
            <a href="#faq" className="py-3 whitespace-nowrap hover:text-primary transition-colors">
              {t('declarationInfo.sectionFaqLabel')}
            </a>
          )}
        </div>
      </div>

      {/* COMPARISON */}
      <section id="farqi" className="section container-page scroll-mt-28">
        <DeclarationComparison declarationValues={declarationValues} certificateValues={certificateValues} />

        <p className="mt-6 text-center text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {t('declarationInfo.resolutionsNotePrefix')}{' '}
          <ResolutionRef number="43" url={page.document43Url} label={t('declarationInfo.resolution43Label')} />{' '}
          {t('declarationInfo.resolutionsNoteSuffix')}
        </p>
      </section>

      {/* TN VED HELPER */}
      <section className="container-page pb-16 md:pb-20 scroll-mt-28">
        <TnVedHelper t={t} />
      </section>

      {/* GUIDE TIMELINE */}
      {guideTitle && guideContent && (
        <section id="qollanma" className="section bg-bg-light scroll-mt-28">
          <div className="container-page max-w-3xl">
            <div className="flex items-start gap-3">
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

            <div className="mt-8 card p-6 md:p-8">
              <GuideTimeline text={guideContent} />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section id="faq" className="section container-page max-w-3xl scroll-mt-28">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-primary pt-2">{t('declarationInfo.faqTitle')}</h2>
          </div>

          <div className="mt-6 space-y-3">
            {faqItems.map((item, idx) => (
              <details key={idx} className="card p-5 group">
                <summary className="cursor-pointer font-medium text-ink list-none flex justify-between items-center gap-3">
                  {item.question}
                  <span className="shrink-0 text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="bg-primary py-14 md:py-16">
        <div className="container-page text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">{t('declarationInfo.finalCtaTitle')}</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/ariza" className="btn-accent">
              {t('nav.apply')}
            </Link>
            <Link
              to="/aloqa"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t('declarationInfo.contactCta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function parseFaq(text) {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => {
      const [question, ...rest] = block.split('\n');
      return { question, answer: rest.join('\n') };
    });
}

function ResolutionRef({ number, url, label }) {
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">
        {label}
      </a>
    );
  }
  return <span className="font-semibold text-accent">{label}</span>;
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

const RESULT_TONES = {
  cert: { box: 'bg-red-50 border-red-200', text: 'text-red-800', icon: 'text-red-600' },
  decl: { box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600' },
  none: { box: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: 'text-amber-600' },
};

function TnVedHelper({ t }) {
  const [query, setQuery] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // 'cert' | 'decl' | 'none' | null

  useEffect(() => {
    const code = query.replace(/\D/g, '');
    setResult(null);
    if (code.length < 4) {
      setChecking(false);
      return undefined;
    }
    setChecking(true);
    const handle = setTimeout(() => {
      checkTnVedRegulation(code)
        .then((data) => {
          if (data.hasMandatoryCert) setResult('cert');
          else if (data.hasDeclaration) setResult('decl');
          else setResult('none');
        })
        .catch(() => setResult(null))
        .finally(() => setChecking(false));
    }, 450);
    return () => clearTimeout(handle);
  }, [query]);

  const tone = result ? RESULT_TONES[result] : null;

  return (
    <div className="card p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">{t('declarationInfo.helperTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('declarationInfo.helperSubtitle')}</p>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('declarationInfo.helperPlaceholder')}
        className="input-field mt-5"
      />

      {checking && (
        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('tnvedCheck.checking')}
        </p>
      )}

      {tone && (
        <div className={`mt-4 rounded-lg border px-4 py-3 flex items-center gap-2.5 text-sm font-semibold ${tone.box} ${tone.text}`}>
          {result === 'none' ? (
            <AlertTriangle className={`h-4 w-4 shrink-0 ${tone.icon}`} />
          ) : (
            <CheckCircle2 className={`h-4 w-4 shrink-0 ${tone.icon}`} />
          )}
          {t(`declarationInfo.helperResult${result === 'cert' ? 'Cert' : result === 'decl' ? 'Decl' : 'None'}`)}
        </div>
      )}

      <Link
        to="/tnved-tekshirish"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        {t('declarationInfo.helperFullCheckLink')} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
