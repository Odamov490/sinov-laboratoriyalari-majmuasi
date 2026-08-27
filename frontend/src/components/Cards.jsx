import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, Download, Mail, Phone, FlaskConical } from 'lucide-react';
import { getLocalized, formatDate } from '../utils/localize';

export function LaboratoryCard({ lab }) {
  const { t, i18n } = useTranslation();
  return (
    <Link to={`/laboratoriyalar/${lab.slug}`} className="card group flex flex-col overflow-hidden">
      <div className="h-44 bg-bg-light flex items-center justify-center overflow-hidden">
        {lab.coverImage ? (
          <img src={lab.coverImage} alt={getLocalized(lab, 'name', i18n.language)} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <FlaskConical className="h-12 w-12 text-primary/20" />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-ink group-hover:text-primary transition-colors">
          {getLocalized(lab, 'name', i18n.language)}
        </h3>
        {getLocalized(lab, 'description', i18n.language) && (
          <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">
            {getLocalized(lab, 'description', i18n.language)}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          {t('common.readMore')} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function ServiceCard({ service }) {
  const { t, i18n } = useTranslation();
  const price = service.prices?.[0];
  return (
    <div className="card p-5 flex flex-col">
      <p className="text-xs font-medium text-secondary uppercase tracking-wide">
        {getLocalized(service.laboratory, 'name', i18n.language)}
      </p>
      <h3 className="mt-1 font-semibold text-ink">{getLocalized(service, 'name', i18n.language)}</h3>
      {service.testObject && <p className="mt-2 text-sm text-slate-500">{service.testObject}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">
          {price?.amount ? `${Number(price.amount).toLocaleString('uz-UZ')} ${price.currency}` : t('common.dataUpdating')}
        </span>
        <Link to={`/xizmatlar/${service.slug}`} className="text-sm font-medium text-primary hover:underline">
          {t('common.readMore')}
        </Link>
      </div>
    </div>
  );
}

export function NewsCard({ item }) {
  const { i18n, t } = useTranslation();
  return (
    <Link to={`/yangiliklar/${item.slug}`} className="card group flex flex-col overflow-hidden">
      <div className="h-40 bg-bg-light overflow-hidden">
        {item.image ? (
          <img src={item.image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-primary/20">
            <FileText className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs text-slate-400">{formatDate(item.publishedAt || item.createdAt, i18n.language)}</p>
        <h3 className="mt-1 font-semibold text-ink line-clamp-2 group-hover:text-primary">
          {getLocalized(item, 'title', i18n.language)}
        </h3>
        <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">
          {getLocalized(item, 'description', i18n.language)}
        </p>
        <span className="mt-3 text-sm font-medium text-primary">{t('common.readMore')}</span>
      </div>
    </Link>
  );
}

export function DocumentCard({ doc }) {
  const { i18n } = useTranslation();
  return (
    <div className="card p-4 flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bg-light text-primary">
        <FileText className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm truncate">{getLocalized(doc, 'title', i18n.language)}</p>
        {doc.category && <p className="text-xs text-slate-400">{getLocalized(doc.category, 'name', i18n.language)}</p>}
      </div>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="p-2 rounded-lg text-primary hover:bg-bg-light shrink-0"
        aria-label="download"
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}

export function StaffCard({ person }) {
  const { i18n } = useTranslation();
  return (
    <div className="card p-5 text-center">
      <div className="mx-auto h-24 w-24 rounded-full bg-bg-light overflow-hidden flex items-center justify-center">
        {person.photo ? (
          <img src={person.photo} alt={person.fullName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-primary/30">{person.fullName?.[0]}</span>
        )}
      </div>
      <h3 className="mt-4 font-semibold text-ink">{person.fullName}</h3>
      <p className="text-sm text-secondary">{person.position}</p>
      {person.laboratory && (
        <p className="mt-1 text-xs text-slate-400">{getLocalized(person.laboratory, 'name', i18n.language)}</p>
      )}
      <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
        {person.phone && (
          <span className="inline-flex items-center justify-center gap-1">
            <Phone className="h-3 w-3" /> {person.phone}
          </span>
        )}
        {person.email && (
          <span className="inline-flex items-center justify-center gap-1">
            <Mail className="h-3 w-3" /> {person.email}
          </span>
        )}
      </div>
    </div>
  );
}

export function EquipmentCard({ item }) {
  const { t } = useTranslation();
  return (
    <Link to={`/uskunalar/${item.slug}`} className="card group overflow-hidden flex flex-col">
      <div className="h-40 bg-bg-light overflow-hidden flex items-center justify-center">
        {item.photo ? (
          <img src={item.photo} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <FlaskConical className="h-10 w-10 text-primary/20" />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-ink group-hover:text-primary">{item.name}</h3>
        {item.manufacturer && <p className="mt-1 text-sm text-slate-500">{item.manufacturer}</p>}
        <span className="mt-3 text-sm font-medium text-primary">{t('common.readMore')}</span>
      </div>
    </Link>
  );
}
