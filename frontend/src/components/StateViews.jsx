import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function Loading({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label || t('common.loading')}</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function EmptyState({ message }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="text-sm">{message || t('common.notFound')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <AlertTriangle className="h-8 w-8 text-red-400" />
      <p className="text-sm">{message || t('common.errorLoading')}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          {t('common.back')}
        </button>
      )}
    </div>
  );
}

export function DataUpdatingBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center rounded-full bg-bg-light px-3 py-1 text-xs font-medium text-slate-500 border border-border">
      {t('common.dataUpdating')}
    </span>
  );
}
