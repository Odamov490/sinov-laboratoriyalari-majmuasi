import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getGallery } from '../services/publicApi';

export default function Gallery() {
  const { t } = useTranslation();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);

  useEffect(() => {
    getGallery().then(setItems).catch(() => setError(true));
  }, []);

  const close = () => setActiveIdx(null);
  const next = (e) => {
    e?.stopPropagation();
    setActiveIdx((i) => (i + 1) % items.length);
  };
  const prev = (e) => {
    e?.stopPropagation();
    setActiveIdx((i) => (i - 1 + items.length) % items.length);
  };

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.gallery') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.gallery')}</h1>

      <div className="mt-10">
        {error ? (
          <ErrorState />
        ) : items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {items.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => setActiveIdx(idx)}
                className="block w-full overflow-hidden rounded-xl border border-border break-inside-avoid focus-ring"
              >
                <img src={g.imageUrl} alt={g.title || ''} loading="lazy" className="w-full object-cover hover:scale-105 transition-transform duration-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {activeIdx !== null && items && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          <button onClick={close} className="absolute top-5 right-5 text-white/80 hover:text-white">
            <X className="h-7 w-7" />
          </button>
          <button onClick={prev} className="absolute left-4 text-white/70 hover:text-white p-2">
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={items[activeIdx].imageUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          <button onClick={next} className="absolute right-4 text-white/70 hover:text-white p-2">
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
}
