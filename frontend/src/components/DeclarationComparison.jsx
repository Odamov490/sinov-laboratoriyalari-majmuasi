import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck, ShieldCheck } from 'lucide-react';

const ROW_KEYS = [
  'compRowApprover',
  'compRowResponsibility',
  'compRowBasis',
  'compRowValidity',
  'compRowScope',
];

// `values` is a "\n"-joined 5-line string (one line per ROW_KEYS entry),
// matching how InfoPage.comparisonDeclarationXx / comparisonCertificateXx
// are stored and edited in the admin form.
function ComparisonCard({ icon: Icon, title, values, tone }) {
  const { t } = useTranslation();
  const lines = (values || '').split('\n');

  return (
    <div className={`card p-6 md:p-7 border-t-4 ${tone === 'gold' ? 'border-t-accent' : 'border-t-primary'}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
            tone === 'gold' ? 'bg-accent/10 text-[#8A6A17]' : 'bg-primary/10 text-primary'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h3 className={`text-base font-extrabold tracking-wide ${tone === 'gold' ? 'text-[#8A6A17]' : 'text-primary'}`}>
          {title}
        </h3>
      </div>

      <dl className="mt-5 divide-y divide-border">
        {ROW_KEYS.map((key, i) => (
          <div key={key} className="py-3 first:pt-0 last:pb-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t(`declarationInfo.${key}`)}
            </dt>
            <dd className="mt-1 text-sm text-ink leading-relaxed">{lines[i] || ''}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function DeclarationComparison({ declarationValues, certificateValues }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ComparisonCard
        icon={FileCheck}
        title={t('declarationInfo.comparisonDeclarationTitle')}
        values={declarationValues}
        tone="primary"
      />
      <ComparisonCard
        icon={ShieldCheck}
        title={t('declarationInfo.comparisonCertificateTitle')}
        values={certificateValues}
        tone="gold"
      />
    </div>
  );
}
