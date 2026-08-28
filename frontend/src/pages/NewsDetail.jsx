import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState } from '../components/StateViews.jsx';
import FormattedText from '../components/FormattedText.jsx';
import { getNewsItem } from '../services/publicApi';
import { getLocalized, formatDate } from '../utils/localize';

export default function NewsDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    setItem(null);
    setError(false);
    getNewsItem(slug).then(setItem).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!item) return <Loading />;

  const images = (item.image || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const coverImage = images[0];
  const galleryImages = images.slice(1);

  const content = getLocalized(item, 'content', i18n.language) || getLocalized(item, 'description', i18n.language);

  return (
    <div className="section container-page max-w-3xl">
      <Breadcrumb items={[{ label: t('nav.news'), to: '/yangiliklar' }, { label: getLocalized(item, 'title', i18n.language) }]} />
      <p className="mt-4 text-sm text-slate-400">{formatDate(item.publishedAt || item.createdAt, i18n.language)}</p>
      <h1 className="mt-2 text-2xl md:text-4xl font-extrabold text-primary leading-tight">
        {getLocalized(item, 'title', i18n.language)}
      </h1>

      {coverImage && (
        <img
          src={coverImage}
          alt=""
          className="mt-8 w-full rounded-xl border border-border cursor-pointer"
          onClick={() => setActiveImage(coverImage)}
        />
      )}

      <div className="mt-8">
        <FormattedText text={content} />
      </div>

      {galleryImages.length > 0 && (
        <div className="mt-10">
          <h2 className="font-semibold text-ink mb-4">Galereya</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryImages.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                loading="lazy"
                className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setActiveImage(url)}
              />
            ))}
          </div>
        </div>
      )}

      {activeImage && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <img src={activeImage} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}