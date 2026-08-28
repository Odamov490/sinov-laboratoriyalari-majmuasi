import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Download } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, DataUpdatingBadge } from '../components/StateViews.jsx';
import FormattedText from '../components/FormattedText.jsx';
import { getAccreditation, getLaboratories, getStandards } from '../services/publicApi';
import { getLocalized, formatDate } from '../utils/localize';

export default function Accreditation() {
  const { t, i18n } = useTranslation();
  const [acc, setAcc] = useState(undefined);
  const [labs, setLabs] = useState([]);
  const [standards, setStandards] = useState([]);

  useEffect(() => {
    getAccreditation().then(setAcc).catch(() => setAcc(null));
    getLaboratories().then(setLabs).catch(() => {});
    getStandards({}).then(setStandards).catch(() => {});
  }, []);

  if (acc === undefined) return <Loading />;

  const scope = acc ? getLocalized(acc, 'scope', i18n.language) : '';

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.accreditation') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.accreditation')}</h1>

      <div className="mt-8 card p-8 bg-primary text-white flex flex-col md:flex-row items-center gap-8">
        <ShieldCheck className="h-20 w-20 text-accent shrink-0" />
        <div>
          <p className="text-2xl font-bold">{acc?.standardCode || 'O‘z DSt ISO/IEC 17025:2019'}</p>
          <p className="mt-1 text-white/70">{t('common.status')}: {acc?.certificateNumber || t('common.dataUpdating')}</p>
          {acc?.issuedAt && <p className="mt-1 text-sm text-white/60">Berilgan sana: {formatDate(acc.issuedAt, i18n.language)}</p>}
          {acc?.validUntil && <p className="text-sm text-white/60">Amal qilish muddati: {formatDate(acc.validUntil, i18n.language)}</p>}
          {acc?.documentUrl && (
            <a href={acc.documentUrl} target="_blank" rel="noreferrer" className="btn-accent mt-4 inline-flex">
              <Download className="h-4 w-4" /> Guvohnoma (PDF)
            </a>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="section-title">Scope</h2>
        {scope ? (
          <div className="mt-4 card p-6">
            <FormattedText text={scope} />
          </div>
        ) : (
          <div className="mt-4"><DataUpdatingBadge /></div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="section-title">{t('nav.laboratories')}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {labs.map((l) => (
            <span key={l.id} className="rounded-full border border-border bg-white px-4 py-2 text-sm text-ink">
              {getLocalized(l, 'name', i18n.language)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="section-title">{t('nav.standards')}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {standards.length === 0 ? (
            <DataUpdatingBadge />
          ) : (
            standards.map((s) => (
              <span key={s.id} className="rounded-full border border-border bg-white px-4 py-2 text-sm text-ink">
                {s.code}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}