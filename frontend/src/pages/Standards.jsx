import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Download } from 'lucide-react';
import { Breadcrumb, SearchBar, Select } from '../components/UI.jsx';
import { Loading, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getStandards } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

const CATEGORIES = ["O‘z DSt", 'IEC', 'ISO', 'GOST', 'EN', 'CISPR', 'Boshqa'];

export default function Standards() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItems(null);
    setError(false);
    const handle = setTimeout(() => {
      getStandards({ q: q || undefined, category: category || undefined }).then(setItems).catch(() => setError(true));
    }, 300);
    return () => clearTimeout(handle);
  }, [q, category]);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.standards') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.standards')}</h1>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchBar value={q} onChange={setQ} />
        <Select
          value={category}
          onChange={setCategory}
          placeholder="Kategoriya"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState />
        ) : items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((s) => (
              <div key={s.id} className="card p-5">
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{s.category}</span>
                </div>
                <p className="mt-2 font-semibold text-ink">{s.code}</p>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{getLocalized(s, 'name', i18n.language)}</p>
                {s.laboratory && (
                  <p className="mt-2 text-xs text-slate-400">{getLocalized(s.laboratory, 'name', i18n.language)}</p>
                )}
                {s.documentUrl && (
                  <a href={s.documentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
