import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

export default function TestModeBanner() {
  const { t } = useTranslation();
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800">
      <div className="container-page flex items-center justify-center gap-2 py-1.5 text-center text-xs sm:text-sm font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>{t('common.testModeBanner')}</span>
      </div>
    </div>
  );
}
