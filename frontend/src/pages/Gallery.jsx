import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { Skeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getGallery, getLaboratories } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

const VIDEO_EXT = ['.mp4', '.webm'];
const SKELETON_HEIGHTS = [220, 160, 260, 190, 240, 170, 230, 200, 250, 180, 210, 260];

function isVideo(url) {
  return VIDEO_EXT.some((ext) => (url || '').toLowerCase().endsWith(ext));
}

function placeholderHeight(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 160 + (h % 140);
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors focus-ring ${
        active
          ? 'border-primary bg-primary text-white shadow-sm'
          : 'border-border bg-bg-light text-slate-600 hover:border-primary/40 hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function GalleryItem({ item, onOpen }) {
  const [loaded, setLoaded] = useState(false);
  const video = isVideo(item.imageUrl);
  const placeholderH = placeholderHeight(item.id);

  return (
    <button
      onClick={onOpen}
      className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-bg-light focus-ring"
    >
      <div className="relative w-full" style={{ minHeight: loaded ? undefined : placeholderH }}>
        {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
        {video ? (
          <video
            src={item.imageUrl}
            className={`block w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            muted
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <img
            src={item.imageUrl}
            alt={item.title || ''}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full object-cover transition-all duration-300 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        {video && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg">
              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
            </span>
          </span>
        )}
      </div>

      {item.title && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="line-clamp-2 text-left text-sm font-medium text-white">{item.title}</span>
        </span>
      )}
    </button>
  );
}

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeLab, setActiveLab] = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);

  const load = () => {
    setError(false);
    getGallery()
      .then(setItems)
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    getLaboratories().then(setLabs).catch(() => setLabs([]));
  }, []);

  const categories = useMemo(() => {
    if (!items) return [];
    const map = new Map();
    items.forEach((g) => {
      if (g.category) map.set(g.category.id, g.category);
    });
    return Array.from(map.values());
  }, [items]);

  const labOptions = useMemo(() => {
    if (!items || !labs.length) return [];
    const usedIds = new Set(items.filter((g) => g.laboratoryId).map((g) => g.laboratoryId));
    return labs.filter((l) => usedIds.has(l.id));
  }, [items, labs]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((g) => {
      if (activeCategory && g.categoryId !== activeCategory) return false;
      if (activeLab && g.laboratoryId !== activeLab) return false;
      return true;
    });
  }, [items, activeCategory, activeLab]);

  const close = () => setActiveIdx(null);
  const next = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + 1) % filtered.length)),
    [filtered.length]
  );
  const prev = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length)),
    [filtered.length]
  );

  useEffect(() => {
    if (activeIdx === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIdx, next, prev]);

  const activeItem = activeIdx !== null ? filtered[activeIdx] : null;

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.gallery') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.gallery')}</h1>

      {items && items.length > 0 && (categories.length > 0 || labOptions.length > 0) && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('gallery.category')}:
                </span>
                <Chip active={!activeCategory} onClick={() => setActiveCategory(null)}>
                  {t('gallery.all')}
                </Chip>
                {categories.map((c) => (
                  <Chip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)}>
                    {getLocalized(c, 'name', i18n.language)}
                  </Chip>
                ))}
              </div>
            )}
            <span className="shrink-0 text-xs text-slate-400">
              {filtered.length} {t('gallery.resultsSuffix')}
            </span>
          </div>

          {labOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('gallery.laboratory')}:
              </span>
              <Chip active={!activeLab} onClick={() => setActiveLab(null)}>
                {t('gallery.all')}
              </Chip>
              {labOptions.map((l) => (
                <Chip key={l.id} active={activeLab === l.id} onClick={() => setActiveLab(l.id)}>
                  {getLocalized(l, 'name', i18n.language)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={() => { setItems(null); load(); }} />
        ) : items === null ? (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
            {SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton key={i} className="mb-4 w-full break-inside-avoid" style={{ height: h }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message={items.length > 0 ? t('gallery.noResults') : undefined} />
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
            {filtered.map((g, idx) => (
              <GalleryItem key={g.id} item={g} onOpen={() => setActiveIdx(idx)} />
            ))}
          </div>
        )}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4" onClick={close}>
          <button
            onClick={close}
            aria-label={t('common.close')}
            className="absolute right-5 top-5 rounded text-white/80 hover:text-white focus-ring"
          >
            <X className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="prev"
            className="absolute left-2 rounded p-2 text-white/70 hover:text-white focus-ring sm:left-4"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div key={activeIdx} className="lightbox-fade flex max-h-full max-w-full flex-col items-center">
            {isVideo(activeItem.imageUrl) ? (
              <video
                src={activeItem.imageUrl}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                className="max-h-[75vh] max-w-full rounded-lg"
              />
            ) : (
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title || ''}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />
            )}
            <div className="mt-4 max-w-xl px-4 text-center">
              {activeItem.title && <p className="font-medium text-white">{activeItem.title}</p>}
              <p className="mt-1 text-sm text-white/50">
                {activeIdx + 1} / {filtered.length}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="next"
            className="absolute right-2 rounded p-2 text-white/70 hover:text-white focus-ring sm:right-4"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
}
