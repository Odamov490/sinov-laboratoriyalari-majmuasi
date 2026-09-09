import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const SITE_NAME = 'Sinov Laboratoriyalari Majmuasi';

/**
 * Per-page <title>/meta tags. Pass explicit `title`/`description` for
 * dynamic detail pages (service/laboratory/news/equipment); list and
 * static pages can pass just `title` and get a tagline-based description
 * for free, so every route ends up with a distinct, localized title
 * instead of the single static one from index.html.
 */
export default function SEO({ title, description, image, type = 'website', jsonLd }) {
  const { t } = useTranslation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || (title ? `${title} — ${t('hero.tagline')}` : t('hero.tagline'));
  const url = typeof window !== 'undefined' ? window.location.href : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
