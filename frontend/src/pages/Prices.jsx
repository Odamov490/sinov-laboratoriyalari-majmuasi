import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Breadcrumb, SearchBar, Pagination } from '../components/UI.jsx';
import { Loading, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { getPrices } from '../services/publicApi';
import { getLocalized, formatDate } from '../utils/localize';

export default function Prices() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    const handle = setTimeout(() => {
      getPrices({ q: q || undefined, page, pageSize: 15 }).then(setData).catch(() => setError(true));
    }, 300);
    return () => clearTimeout(handle);
  }, [q, page]);

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.prices') }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary">{t('nav.prices')}</h1>
          <p className="section-subtitle">Narxlar admin panel orqali boshqariladi va tarixi saqlanadi.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary !py-2.5" title="Excel export">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button className="btn-secondary !py-2.5" title="PDF export">
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="mt-6 max-w-md">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} />
      </div>

      <div className="mt-8 card overflow-x-auto">
        {error ? (
          <ErrorState />
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">{t('application.service')}</th>
                <th className="px-4 py-3">{t('nav.laboratories')}</th>
                <th className="px-4 py-3">Standart</th>
                <th className="px-4 py-3">Muddat</th>
                <th className="px-4 py-3">Narx</th>
                <th className="px-4 py-3">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((p, idx) => (
                <tr key={p.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 text-slate-400">{(page - 1) * 15 + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-ink">{getLocalized(p.service, 'name', i18n.language)}</td>
                  <td className="px-4 py-3 text-slate-600">{getLocalized(p.service?.laboratory, 'name', i18n.language)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.service?.standard?.code || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.service?.durationDays ? `${p.service.durationDays} kun` : '—'}</td>
                  <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                    {p.amount ? `${Number(p.amount).toLocaleString('uz-UZ')} ${p.currency}` : t('common.dataUpdating')}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(p.effectiveFrom, i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pageSize={15} total={data.total} onChange={setPage} />}
    </div>
  );
}
