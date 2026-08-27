import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Search, ChevronLeft } from 'lucide-react';

export function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-light"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-9 w-9 rounded-lg text-sm font-medium ${
            p === page ? 'bg-primary text-white' : 'border border-border text-slate-600 hover:bg-bg-light'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-light"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="breadcrumb" className="text-sm text-slate-500 flex flex-wrap items-center gap-1.5">
      <Link to="/" className="hover:text-primary">
        Bosh sahifa
      </Link>
      {items.map((it, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          {it.to ? (
            <Link to={it.to} className="hover:text-primary">
              {it.label}
            </Link>
          ) : (
            <span className="text-ink font-medium">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

const STATUS_STYLES = {
  QABUL_QILINDI: 'bg-blue-50 text-blue-700 border-blue-200',
  KORIB_CHIQILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  SINOV_JARAYONIDA: 'bg-secondary/10 text-secondary border-secondary/30',
  NATIJA_TAYYOR: 'bg-purple-50 text-purple-700 border-purple-200',
  YAKUNLANDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BEKOR_QILINDI: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  QABUL_QILINDI: 'Qabul qilindi',
  KORIB_CHIQILMOQDA: "Ko'rib chiqilmoqda",
  SINOV_JARAYONIDA: 'Sinov jarayonida',
  NATIJA_TAYYOR: 'Natija tayyor',
  YAKUNLANDI: 'Yakunlandi',
  BEKOR_QILINDI: 'Bekor qilindi',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export const APPLICATION_STATUSES = Object.keys(STATUS_LABELS);
export { STATUS_LABELS };

export function SearchBar({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('common.search')}
        className="input-field pl-10"
      />
    </div>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="input-field">
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
