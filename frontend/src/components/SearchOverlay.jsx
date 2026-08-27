import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { globalSearch } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function SearchOverlay({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      globalSearch(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return null;

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const groups = results
    ? [
        { key: 'laboratories', label: t('nav.laboratories'), base: '/laboratoriyalar' },
        { key: 'services', label: t('nav.services'), base: '/xizmatlar' },
        { key: 'standards', label: t('nav.standards'), base: '/standartlar' },
        { key: 'news', label: t('nav.news'), base: '/yangiliklar' },
        { key: 'equipment', label: t('nav.equipment'), base: '/uskunalar' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[110] bg-primary/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search')}
            className="flex-1 outline-none text-sm"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && <p className="text-center text-sm text-slate-400 py-6">{t('common.loading')}</p>}
          {!loading && results && groups.every((g) => (results[g.key] || []).length === 0) && (
            <p className="text-center text-sm text-slate-400 py-6">{t('common.notFound')}</p>
          )}
          {!loading &&
            results &&
            groups.map(
              (g) =>
                (results[g.key] || []).length > 0 && (
                  <div key={g.key} className="mb-2">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {g.label}
                    </p>
                    {results[g.key].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => go(`${g.base}/${item.slug || item.id}`)}
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-bg-light text-sm text-ink"
                      >
                        {getLocalized(item, 'name', i18n.language) ||
                          getLocalized(item, 'title', i18n.language) ||
                          item.code ||
                          item.name}
                      </button>
                    ))}
                  </div>
                )
            )}
        </div>
      </div>
    </div>
  );
}
