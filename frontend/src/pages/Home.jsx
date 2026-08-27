import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Cpu,
  Users,
  BadgeCheck,
  Layers,
  Award,
  ArrowRight,
} from 'lucide-react';
import Hero from '../components/Hero.jsx';
import { LaboratoryCard, ServiceCard, NewsCard, DocumentCard } from '../components/Cards.jsx';
import { CardSkeleton } from '../components/StateViews.jsx';
import {
  getLaboratories,
  getServices,
  getAccreditation,
  getNews,
  getDocuments,
  getFaq,
} from '../services/publicApi';
import { getLocalized } from '../utils/localize';

const WHY_ICONS = [ShieldCheck, Cpu, Users, BadgeCheck, Layers, Award];

export default function Home() {
  const { t, i18n } = useTranslation();
  const [labs, setLabs] = useState(null);
  const [services, setServices] = useState(null);
  const [accreditation, setAccreditation] = useState(null);
  const [news, setNews] = useState(null);
  const [docs, setDocs] = useState(null);
  const [faq, setFaq] = useState(null);

  useEffect(() => {
    getLaboratories().then(setLabs).catch(() => setLabs([]));
    getServices({ pageSize: 6 }).then((d) => setServices(d.items)).catch(() => setServices([]));
    getAccreditation().then(setAccreditation).catch(() => setAccreditation(null));
    getNews({ pageSize: 3 }).then((d) => setNews(d.items)).catch(() => setNews([]));
    getDocuments().then((d) => setDocs(d.slice(0, 4))).catch(() => setDocs([]));
    getFaq().then((d) => setFaq(d.slice(0, 6))).catch(() => setFaq([]));
  }, []);

  const whyItems = Object.entries(t('whyUs.items', { returnObjects: true }));
  const processSteps = Object.entries(t('process.steps', { returnObjects: true }));

  const stats = [
    { label: '8 ta laboratoriya', value: '8' },
    { label: "17025 akkreditatsiyasi", value: 'ISO 17025' },
    { label: 'Sinov yo‘nalishlari', value: labs ? `${labs.length * 6}+` : t('common.dataUpdating') },
  ];

  return (
    <div>
      <Hero />

      {/* Statistics */}
      <section className="section bg-bg-light">
        <div className="container-page grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="card p-6 text-center">
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Laboratories */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="section-title">{t('nav.laboratories')}</h2>
              <p className="section-subtitle">
                {t('hero.tagline')}
              </p>
            </div>
            <Link to="/laboratoriyalar" className="text-sm font-semibold text-primary flex items-center gap-1">
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {labs === null
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : labs.slice(0, 8).map((lab) => <LaboratoryCard key={lab.id} lab={lab} />)}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section bg-bg-light">
        <div className="container-page">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="section-title">{t('nav.services')}</h2>
            <Link to="/xizmatlar" className="text-sm font-semibold text-primary flex items-center gap-1">
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services === null
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : services.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        </div>
      </section>

      {/* Accreditation */}
      <section className="section">
        <div className="container-page grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="section-title">{t('nav.accreditation')}</h2>
            <p className="section-subtitle">
              {accreditation
                ? `${accreditation.certificateNumber} — ${accreditation.standardCode}`
                : t('common.dataUpdating')}
            </p>
            {accreditation && getLocalized(accreditation, 'scope', i18n.language) && (
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                {getLocalized(accreditation, 'scope', i18n.language)}
              </p>
            )}
            <Link to="/akkreditatsiya" className="btn-primary mt-6 inline-flex">
              {t('common.readMore')}
            </Link>
          </div>
          <div className="card p-8 flex flex-col items-center justify-center text-center bg-bg-light">
            <ShieldCheck className="h-16 w-16 text-primary" />
            <p className="mt-4 font-semibold text-primary text-lg">
              {accreditation?.standardCode || 'O‘z DSt ISO/IEC 17025:2019'}
            </p>
            <p className="text-sm text-slate-500 mt-1">{accreditation?.certificateNumber || t('common.dataUpdating')}</p>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="section bg-bg-light">
        <div className="container-page">
          <h2 className="section-title text-center">{t('whyUs.title')}</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyItems.map(([key, label], idx) => {
              const Icon = WHY_ICONS[idx % WHY_ICONS.length];
              return (
                <div key={key} className="card p-6 flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-ink pt-2">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testing Process */}
      <section className="section">
        <div className="container-page">
          <h2 className="section-title text-center">{t('process.title')}</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map(([key, label], idx) => (
              <div key={key} className="card p-6 relative">
                <span className="text-4xl font-extrabold text-primary/10 absolute top-4 right-5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="font-semibold text-primary relative">{String(idx + 1).padStart(2, '0')}</p>
                <p className="mt-2 text-sm text-ink relative">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="section bg-bg-light">
        <div className="container-page">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="section-title">{t('nav.news')}</h2>
            <Link to="/yangiliklar" className="text-sm font-semibold text-primary flex items-center gap-1">
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news === null
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : news.length > 0
              ? news.map((n) => <NewsCard key={n.id} item={n} />)
              : <p className="text-slate-500 text-sm">{t('common.dataUpdating')}</p>}
          </div>
        </div>
      </section>

      {/* Documents */}
      {docs && docs.length > 0 && (
        <section className="section">
          <div className="container-page">
            <h2 className="section-title">{t('nav.documents')}</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docs.map((d) => (
                <DocumentCard key={d.id} doc={d} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="section bg-bg-light">
          <div className="container-page max-w-3xl">
            <h2 className="section-title text-center">{t('nav.faq')}</h2>
            <div className="mt-8 space-y-3">
              {faq.map((f) => (
                <details key={f.id} className="card p-5 group">
                  <summary className="cursor-pointer font-medium text-ink list-none flex justify-between items-center">
                    {getLocalized(f, 'question', i18n.language)}
                    <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {getLocalized(f, 'answer', i18n.language)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container-page">
          <div className="card bg-primary text-white p-10 md:p-14 text-center rounded-2xl">
            <h2 className="text-2xl md:text-3xl font-bold">{t('hero.cta2')}</h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">{t('hero.tagline')}</p>
            <Link to="/ariza" className="btn-accent mt-8 inline-flex">
              {t('hero.cta2')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
