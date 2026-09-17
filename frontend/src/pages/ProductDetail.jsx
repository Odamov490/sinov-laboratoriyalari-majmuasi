import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, FileSearch } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { Breadcrumb } from '../components/UI.jsx';
import { Loading, ErrorState, EmptyState } from '../components/StateViews.jsx';
import { getProduct, generateTestProgram, downloadTestProgramDocx } from '../services/publicApi';
import { getLocalized } from '../utils/localize';

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState({}); // questionId -> optionId
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setProduct(null);
    setError(false);
    setResult(null);
    setSelected({});
    getProduct(slug).then(setProduct).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="section container-page"><ErrorState /></div>;
  if (!product) return <Loading />;

  const selectedOptions = Object.entries(selected)
    .filter(([, optionId]) => optionId)
    .map(([questionId, optionId]) => ({ questionId, optionId }));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateTestProgram(slug, selectedOptions);
      setResult(res.indicators);
    } catch {
      setResult([]);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadTestProgramDocx(slug, selectedOptions);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sinov-dasturi-${slug}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently ignore — the button stays available to retry
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="section container-page">
      <SEO title={getLocalized(product, 'name', i18n.language)} />
      <Breadcrumb
        items={[
          { label: t('testProgram.title'), to: '/mahsulotlar' },
          { label: getLocalized(product, 'name', i18n.language) },
        ]}
      />

      <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-primary">
        {getLocalized(product, 'name', i18n.language)}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{getLocalized(product.laboratory, 'name', i18n.language)}</p>
      {product.descriptionUz && <p className="mt-4 text-slate-600 max-w-3xl">{product.descriptionUz}</p>}

      {product.questions.length > 0 && (
        <div className="mt-8 card p-6 max-w-3xl">
          <h2 className="font-semibold text-ink">{t('testProgram.answerQuestions')}</h2>
          <div className="mt-4 space-y-5">
            {product.questions.map((q) => (
              <div key={q.id}>
                <p className="text-sm font-medium text-ink">{getLocalized(q, 'question', i18n.language)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        selected[q.id] === opt.id
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border text-slate-600 hover:bg-bg-light'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="sr-only"
                        checked={selected[q.id] === opt.id}
                        onChange={() => {
                          setSelected((s) => ({ ...s, [q.id]: opt.id }));
                          setResult(null);
                        }}
                      />
                      {getLocalized(opt, 'label', i18n.language)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={handleGenerate} disabled={generating} className="btn-primary inline-flex items-center gap-2">
          <FileSearch className="h-4 w-4" />
          {t('testProgram.viewProgram')}
        </button>
        {result && result.length > 0 && (
          <button onClick={handleDownload} disabled={downloading} className="btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('testProgram.downloadDocx')}
          </button>
        )}
      </div>

      {result && (
        <div className="mt-8 card overflow-x-auto max-w-4xl">
          {result.length === 0 ? (
            <div className="p-6"><EmptyState message={t('testProgram.noIndicators')} /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-bg-light text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('testProgram.indicatorName')}</th>
                  <th className="px-4 py-3">{t('testProgram.standardCode')}</th>
                  <th className="px-4 py-3">{t('testProgram.method')}</th>
                  <th className="px-4 py-3">{t('testProgram.unit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.map((ind, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-ink">{getLocalized(ind, 'name', i18n.language)}</td>
                    <td className="px-4 py-3 text-slate-500">{ind.standardCode || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{ind.method || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{ind.unit || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
