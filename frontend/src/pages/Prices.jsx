import React, { useEffect, useRef, useState } from 'react';
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
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const hiddenTableRef = useRef(null);

  useEffect(() => {
    setData(null);
    setError(false);
    const handle = setTimeout(() => {
      getPrices({ q: q || undefined, page, pageSize: 15 }).then(setData).catch(() => setError(true));
    }, 300);
    return () => clearTimeout(handle);
  }, [q, page]);

  const rowsFor = (items) =>
    items.map((p, idx) => ({
      '№': idx + 1,
      Xizmat: getLocalized(p.service, 'name', i18n.language),
      Laboratoriya: getLocalized(p.service?.laboratory, 'name', i18n.language),
      Standart: p.service?.standard?.code || '—',
      Muddat: p.service?.durationDays ? `${p.service.durationDays} kun` : '—',
      Narx: p.amount ? `${Number(p.amount).toLocaleString('uz-UZ')} ${p.currency}` : "Ma'lumot yangilanmoqda",
      Sana: formatDate(p.effectiveFrom, i18n.language),
    }));

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const full = await getPrices({ q: q || undefined, page: 1, pageSize: 1000 });
      const XLSX = await import('xlsx');
      const rows = rowsFor(full.items);
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 35 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Narxlar');
      XLSX.writeFile(wb, `narxlar-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const full = await getPrices({ q: q || undefined, page: 1, pageSize: 1000 });
      const rows = rowsFor(full.items);

      const container = hiddenTableRef.current;
      container.innerHTML = '';

      const title = document.createElement('h2');
      title.textContent = "Narxlar ro'yxati — Sinov Laboratoriyalari Majmuasi";
      title.style.cssText = 'font-size:16px;font-weight:700;margin-bottom:12px;color:#0B3A63;font-family:Arial,sans-serif;';
      container.appendChild(title);

      const table = document.createElement('table');
      table.style.cssText = 'border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11px;color:#17212B;';
      const headHtml = `
        <thead>
          <tr>
            ${['№', 'Xizmat', 'Laboratoriya', 'Standart', 'Muddat', 'Narx', 'Sana']
              .map((h) => `<th style="border:1px solid #E2E8F0;padding:6px 8px;background:#F5F8FB;text-align:left;">${h}</th>`)
              .join('')}
          </tr>
        </thead>`;
      const bodyHtml = `
        <tbody>
          ${rows
            .map(
              (r) => `<tr>
                ${Object.values(r)
                  .map((v) => `<td style="border:1px solid #E2E8F0;padding:6px 8px;">${v}</td>`)
                  .join('')}
              </tr>`
            )
            .join('')}
        </tbody>`;
      table.innerHTML = headHtml + bodyHtml;
      container.appendChild(table);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`narxlar-${new Date().toISOString().slice(0, 10)}.pdf`);
      container.innerHTML = '';
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.prices') }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary">{t('nav.prices')}</h1>
          <p className="section-subtitle">Narxlar admin panel orqali boshqariladi va tarixi saqlanadi.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} disabled={exportingExcel} className="btn-secondary !py-2.5">
            <FileSpreadsheet className="h-4 w-4" /> {exportingExcel ? 'Tayyorlanmoqda...' : 'Excel'}
          </button>
          <button onClick={handleExportPdf} disabled={exportingPdf} className="btn-secondary !py-2.5">
            <Download className="h-4 w-4" /> {exportingPdf ? 'Tayyorlanmoqda...' : 'PDF'}
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

      <div
        ref={hiddenTableRef}
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '900px', background: '#ffffff', padding: '16px' }}
      />
    </div>
  );
}