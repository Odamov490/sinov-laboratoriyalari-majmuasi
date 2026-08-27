import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="section container-page text-center py-32">
      <FlaskConical className="h-16 w-16 text-primary/20 mx-auto" />
      <p className="mt-6 text-6xl font-extrabold text-primary">404</p>
      <p className="mt-3 text-slate-500">{t('common.pageNotFound')}</p>
      <Link to="/" className="btn-primary mt-8 inline-flex">
        {t('nav.home')}
      </Link>
    </div>
  );
}
