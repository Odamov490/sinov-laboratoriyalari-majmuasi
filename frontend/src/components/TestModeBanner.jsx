import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

export default function TestModeBanner() {
  const { t } = useTranslation();
  const message = t('common.testModeBanner');

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 overflow-hidden">
      <span className="sr-only">{message}</span>

      <div
        className="test-banner-static container-page flex items-center justify-center gap-2 py-1.5 text-center text-xs sm:text-sm font-medium"
        aria-hidden="true"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>{message}</span>
      </div>

      <div className="test-banner-track flex items-center py-1.5 text-xs sm:text-sm font-medium w-max" aria-hidden="true">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-2 px-10 shrink-0 whitespace-nowrap">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
