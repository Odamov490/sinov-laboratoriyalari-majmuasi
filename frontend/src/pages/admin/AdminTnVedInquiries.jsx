import React, { useEffect, useState } from 'react';
import { PhoneCall, CheckCircle2 } from 'lucide-react';
import { adminTnVedInquiries } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Select, Pagination } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';

const STATUS_LABELS = {
  YANGI: 'Yangi',
  BOGLANILDI: "Bog'lanildi",
  ARIZAGA_AYLANDI: 'Arizaga aylandi',
};

const STATUS_STYLES = {
  YANGI: 'bg-amber-50 text-amber-700 border-amber-200',
  BOGLANILDI: 'bg-secondary/10 text-secondary border-secondary/30',
  ARIZAGA_AYLANDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS).map((value) => ({ value, label: STATUS_LABELS[value] }));

const PAGE_SIZE = 20;

export default function AdminTnVedInquiries() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setError(false);
    adminTnVedInquiries
      .list({ status: status || undefined, page, pageSize: PAGE_SIZE })
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const markContacted = async (inquiry) => {
    setBusyId(inquiry.id);
    try {
      await adminTnVedInquiries.updateStatus(inquiry.id, 'BOGLANILDI');
      showToast(`${inquiry.fullName} bilan bog'lanildi deb belgilandi.`, 'success');
      load();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">TN VED so'rovlari</h1>
      <p className="text-sm text-slate-500 mb-6">
        Mijozlar ariza formasida TN VED kodini qidirgach qoldirgan aloqa ma'lumotlari — ular hali to'liq
        ariza yubormagan bo'lsa ham shu yerda ko'rinadi, mutaxassis o'zi bog'lanishi mumkin.
      </p>

      <div className="max-w-xs mb-5">
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          placeholder="Barcha holatlar"
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState message="Hozircha TN VED so'rovlari yo'q." />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">So'ralgan kod</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((inq) => (
                <tr key={inq.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 font-medium text-ink">{inq.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <a href={`tel:${inq.phone}`} className="hover:text-primary hover:underline">{inq.phone}</a>
                    {inq.email && <div className="text-xs text-slate-400">{inq.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-primary">{inq.tnVedCode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(inq.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[inq.status]}`}>
                      {STATUS_LABELS[inq.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inq.status === 'YANGI' ? (
                      <button
                        onClick={() => markContacted(inq)}
                        disabled={busyId === inq.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Bog'landim
                      </button>
                    ) : inq.status === 'BOGLANILDI' ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ariza mavjud
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}
    </div>
  );
}
