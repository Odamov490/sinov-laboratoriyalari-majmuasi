import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { ServiceCard, StaffCard, EquipmentCard } from '../components/Cards.jsx';
import { Loading, ErrorState, DataUpdatingBadge } from '../components/StateViews.jsx';
import FormattedText from '../components/FormattedText.jsx';
import { getLaboratory } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function LaboratoryDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [lab, setLab] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLab(null);
    setError(false);
    getLaboratory(slug)
      .then(setLab)
      .catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!lab) return <Loading />;

  const about = getLocalized(lab, 'about', i18n.language);

  return (
    <div>
      <div className="bg-primary py-14">
        <div className="container-page">
          <Breadcrumb items={[{ label: t('nav.laboratories'), to: '/laboratoriyalar' }, { label: getLocalized(lab, 'name', i18n.language) }]} />
          <h1 className="mt-4 text-2xl md:text-4xl font-extrabold text-white max-w-3xl">
            {getLocalized(lab, 'name', i18n.language)}
          </h1>
          {getLocalized(lab, 'description', i18n.language) && (
            <p className="mt-3 text-white/70 max-w-2xl">{getLocalized(lab, 'description', i18n.language)}</p>
          )}
          <Link to="/ariza" className="btn-accent mt-6 inline-flex">
            {t('common.apply')}
          </Link>
        </div>
      </div>

      <div className="section container-page">
        {about ? (
          <div className="card p-6">
            <FormattedText text={about} />
          </div>
        ) : (
          <DataUpdatingBadge />
        )}

        {lab.accreditationScope && (
          <div className="mt-6 card p-5 bg-bg-light">
            <p className="text-sm font-semibold text-primary">Akkreditatsiya sohasi</p>
            <div className="mt-2">
              <FormattedText text={lab.accreditationScope} />
            </div>
          </div>
        )}

        {lab.services && lab.services.length > 0 && (
          <div className="mt-14">
            <h2 className="section-title">{t('nav.services')}</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lab.services.map((s) => (
                <ServiceCard key={s.id} service={{ ...s, laboratory: lab }} />
              ))}
            </div>
          </div>
        )}

        {lab.equipment && lab.equipment.length > 0 && (
          <div className="mt-14">
            <h2 className="section-title">{t('nav.equipment')}</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {lab.equipment.map((e) => (
                <EquipmentCard key={e.id} item={e} />
              ))}
            </div>
          </div>
        )}

        {lab.staff && lab.staff.length > 0 && (
          <div className="mt-14">
            <h2 className="section-title">{t('nav.staff')}</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {lab.staff.map((s) => (
                <StaffCard key={s.id} person={s} />
              ))}
            </div>
          </div>
        )}

        {lab.standards && lab.standards.length > 0 && (
          <div className="mt-14">
            <h2 className="section-title">{t('nav.standards')}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {lab.standards.map((s) => (
                <span key={s.id} className="rounded-full border border-border bg-white px-4 py-2 text-sm text-ink flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5 text-primary" /> {s.code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}