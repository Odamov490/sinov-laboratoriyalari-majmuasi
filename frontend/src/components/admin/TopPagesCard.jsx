import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getTopPages } from '../../services/adminApi';
import { Loading, ErrorState } from '../StateViews.jsx';

// Public route -> readable name; detail pages ("/yangiliklar/<slug>") are
// shown as "Yangiliklar › <slug>".
const PAGE_LABELS = {
  '/': 'Bosh sahifa',
  '/biz-haqimizda': 'Biz haqimizda',
  '/laboratoriyalar': 'Laboratoriyalar',
  '/xizmatlar': 'Xizmatlar',
  '/narxlar': 'Narxlar',
  '/standartlar': 'Standartlar',
  '/akkreditatsiya': 'Akkreditatsiya',
  '/yangiliklar': 'Yangiliklar',
  '/hujjatlar': 'Hujjatlar',
  '/mutaxassislar': 'Mutaxassislar',
  '/uskunalar': 'Uskunalar',
  '/galereya': 'Galereya',
  '/faq': 'FAQ',
  '/arizani-tekshirish': 'Arizani tekshirish',
  '/ariza': 'Ariza yuborish',
  '/tnved-tekshirish': 'TN VED tekshirish',
  '/mxik-tekshirish': 'MXIK tekshirish',
  '/deklaratsiya-va-sertifikat': 'Deklaratsiya va sertifikat',
  '/mahsulotlar': 'Sinov dasturlari',
  '/aloqa': 'Aloqa',
};

function pageLabel(path) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const [, section, ...rest] = path.split('/');
  const parent = PAGE_LABELS[`/${section}`];
  return parent && rest.length ? `${parent} › ${rest.join('/')}` : path;
}

// "Eng ko'p ko'rilgan sahifalar" — from our own page-view counter (not
// Cloudflare), so it renders even when Cloudflare Analytics isn't set up.
export default function TopPagesCard({ range }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setData(null);
    setError(false);
    getTopPages({ ...range, limit: 10 })
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const maxViews = data?.pages[0]?.views || 0;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p className="text-sm font-semibold text-ink">Eng ko'p ko'rilgan sahifalar</p>
        {data && (
          <p className="text-xs text-slate-500">
            Jami: <span className="font-semibold text-ink">{data.totalViews.toLocaleString('uz-UZ')}</span> ko'rish
          </p>
        )}
      </div>

      {error ? (
        <ErrorState message="Ma'lumotni olishda xatolik yuz berdi." onRetry={load} retryLabel="Qayta urinish" />
      ) : data === null ? (
        <Loading />
      ) : data.pages.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Tanlangan oraliq uchun ma'lumot topilmadi.</p>
      ) : (
        <ol className="space-y-3">
          {data.pages.map((page, idx) => {
            const share = data.totalViews ? (page.views / data.totalViews) * 100 : 0;
            return (
              <li key={page.path} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="text-xs font-semibold text-slate-400 tabular-nums">{idx + 1}.</span>
                <div className="min-w-0">
                  <a
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-ink hover:text-primary"
                    title={page.path}
                  >
                    <span className="truncate">{pageLabel(page.path)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60" />
                  </a>
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums text-right">
                  {page.views.toLocaleString('uz-UZ')}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">{share.toFixed(1)}%</span>
                </span>
                <div className="col-start-2 col-span-2 h-1.5 rounded-full bg-bg-light overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${maxViews ? (page.views / maxViews) * 100 : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
