import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, FlaskConical, Wallet, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminTestJournal } from '../../../services/adminApi';
import { Loading, ErrorState } from '../../../components/StateViews.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { RESULT_LABELS, RESULT_STYLES, formatMoney } from './journalConstants';

const NAVY = '#0B3A63';
const GRID = '#E2E8F0';
const TOP_BODIES = 10;
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const monthLabel = (m) => {
  if (!m) return "Sanasiz";
  const [y, mm] = m.split('-');
  return `${MONTHS[Number(mm) - 1]} ${y}`;
};
const pct = (v) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`);
const fmtInt = (n) => Number(n || 0).toLocaleString('ru-RU');

// Top N customers plus one "Boshqalar" row folding in the rest.
function topBodies(rows) {
  if (rows.length <= TOP_BODIES) return rows;
  const rest = rows.slice(TOP_BODIES);
  const other = rest.reduce(
    (acc, r) => ({ ...acc, records: acc.records + r.records, samples: acc.samples + r.samples, amount: (acc.amount || 0) + (r.amount || 0) }),
    { id: 'other', name: `Boshqalar (${rest.length} ta)`, records: 0, samples: 0, amount: 0 }
  );
  return [...rows.slice(0, TOP_BODIES), other];
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-ink tabular-nums truncate">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

// Breakdown table with an inline bar for the share of samples.
function BreakdownTable({ title, rows, nameOf, showFinance, totalSamples }) {
  const max = Math.max(...rows.map((r) => r.samples), 1);
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-ink mb-3">{title}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-2">Nomi</th>
            <th className="py-2 px-2 text-right">Yozuv</th>
            <th className="py-2 px-2 text-right">Namuna</th>
            {showFinance && <th className="py-2 pl-2 text-right">Summa</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id || r.result || r.name}>
              <td className="py-2 pr-2 max-w-[220px]">
                <div className="truncate text-ink" title={typeof nameOf(r) === 'string' ? nameOf(r) : undefined}>
                  {nameOf(r)}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-bg-light overflow-hidden" title={`${totalSamples ? ((r.samples / totalSamples) * 100).toFixed(1) : 0}% namunalar`}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(r.samples / max) * 100}%` }} />
                </div>
              </td>
              <td className="py-2 px-2 text-right tabular-nums">{fmtInt(r.records)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{fmtInt(r.samples)}</td>
              {showFinance && <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">{formatMoney(r.amount)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthChart({ title, data, dataKey, name, format }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-ink mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} interval={0} />
          <YAxis tick={{ fontSize: 11 }} width={format ? 72 : 40} tickFormatter={format} allowDecimals={false} />
          <Tooltip formatter={(v) => (format ? `${formatMoney(v)} so'm` : fmtInt(v))} cursor={{ fill: 'rgba(11,58,99,0.06)' }} />
          <Bar dataKey={dataKey} name={name} fill={NAVY} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// "Umumiy hisobot" tab: report-rule totals for a period, monthly table/charts
// and breakdowns by product type, customer (top 10) and result.
export default function TestJournalSummaryTab({ showFinance }) {
  const { showToast } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = () => {
    setError(false);
    setData(null);
    adminTestJournal
      .summary({ from: from || undefined, to: to || undefined, includeCancelled: includeCancelled ? 1 : 0 })
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, includeCancelled]);

  const setPreset = (key) => {
    const year = new Date().getFullYear();
    if (key === 'all') {
      setFrom('');
      setTo('');
    } else {
      setFrom(`${year}-01-01`);
      setTo(`${year}-12-31`);
    }
  };

  const exportExcel = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const sheet = (rows, nameKey, nameLabel, nameFn) => {
        const out = rows.map((r) => ({
          [nameLabel]: nameFn ? nameFn(r) : r[nameKey],
          Yozuvlar: r.records,
          Namunalar: r.samples,
          ...(showFinance && { "Summa (so'm)": r.amount }),
        }));
        out.push({
          [nameLabel]: 'JAMI',
          Yozuvlar: data.totals.records,
          Namunalar: data.totals.samples,
          ...(showFinance && { "Summa (so'm)": data.totals.amount }),
        });
        const ws = XLSX.utils.json_to_sheet(out);
        ws['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
        return ws;
      };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet(data.byMonth, 'month', 'Oy', (r) => monthLabel(r.month)), 'Oylar');
      XLSX.utils.book_append_sheet(wb, sheet(data.byProductType, 'name', 'Mahsulot turi'), 'Mahsulot turlari');
      XLSX.utils.book_append_sheet(wb, sheet(data.byCertificationBody, 'name', 'Buyurtmachi'), 'Buyurtmachilar');
      XLSX.utils.book_append_sheet(wb, sheet(data.byResult, 'result', 'Natija', (r) => RESULT_LABELS[r.result] || r.result), 'Natijalar');
      const period = `${from || 'boshidan'}_${to || 'hozirgacha'}`;
      XLSX.writeFile(wb, `umumiy-hisobot_${period}.xlsx`);
    } catch {
      showToast('Excel eksportda xatolik yuz berdi.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const monthData = (data?.byMonth || []).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const compactMoney = (v) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)} mlrd` : v >= 1e6 ? `${Math.round(v / 1e6)} mln` : fmtInt(v));

  return (
    <div>
      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setPreset('all')} className="btn-secondary !py-1.5 !px-3 text-xs">
          Hammasi
        </button>
        <button type="button" onClick={() => setPreset('year')} className="btn-secondary !py-1.5 !px-3 text-xs">
          Joriy yil
        </button>
        <label className="flex items-center gap-1.5 text-sm text-slate-500">
          Davr:
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="input-field !py-1.5 !w-auto text-sm" />
          —
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="input-field !py-1.5 !w-auto text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={(e) => setIncludeCancelled(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          Bekor qilinganlarni ham hisoblash
        </label>
        <button onClick={exportExcel} disabled={!data || exporting} className="btn-secondary !py-1.5 !px-3 text-xs ml-auto">
          <FileSpreadsheet className="h-4 w-4" /> {exporting ? 'Tayyorlanmoqda...' : 'Excel'}
        </button>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Davr namuna kelgan sana bo'yicha (bo'lmasa akt sanasi).{' '}
        {includeCancelled
          ? "Bekor qilingan va namuna taqdim etilmagan yozuvlar ham hisobga olinmoqda."
          : "Bekor qilingan va namuna taqdim etilmagan yozuvlar namuna va summaga kirmaydi; namunalar = soni − bekor qilinganlar."}
      </p>

      {error ? (
        <div className="card p-6">
          <ErrorState onRetry={load} />
        </div>
      ) : !data ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFinance ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
            <StatCard icon={FileText} label="Yozuvlar" value={fmtInt(data.totals.records)} />
            <StatCard icon={FlaskConical} label="Namunalar" value={fmtInt(data.totals.samples)} />
            {showFinance && <StatCard icon={Wallet} label="Summa, so'm" value={formatMoney(data.totals.amount)} />}
            <StatCard
              icon={CheckCircle2}
              label="Mos / mos emas"
              value={`${pct(data.totals.conformShare)} / ${pct(data.totals.nonconformShare)}`}
              hint="Yakuniy natijali yozuvlar ichida"
            />
          </div>

          {monthData.length > 0 && (
            <div className={`grid grid-cols-1 ${showFinance ? 'lg:grid-cols-2' : ''} gap-5`}>
              <MonthChart title="Oylar bo'yicha namunalar" data={monthData} dataKey="samples" name="Namunalar" />
              {showFinance && <MonthChart title="Oylar bo'yicha summa, so'm" data={monthData} dataKey="amount" name="Summa" format={compactMoney} />}
            </div>
          )}

          <div className="card p-5 overflow-x-auto">
            <p className="text-sm font-semibold text-ink mb-3">Oylik jadval</p>
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2">Oy</th>
                  <th className="py-2 px-2 text-right">Yozuvlar</th>
                  <th className="py-2 px-2 text-right">Namunalar</th>
                  {showFinance && <th className="py-2 pl-2 text-right">Summa, so'm</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthData.map((m) => (
                  <tr key={m.month || 'none'}>
                    <td className="py-2 pr-2">{m.label}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmtInt(m.records)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmtInt(m.samples)}</td>
                    {showFinance && <td className="py-2 pl-2 text-right tabular-nums">{formatMoney(m.amount)}</td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-ink border-t-2 border-border">
                  <td className="py-2 pr-2">Jami</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtInt(data.totals.records)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtInt(data.totals.samples)}</td>
                  {showFinance && <td className="py-2 pl-2 text-right tabular-nums">{formatMoney(data.totals.amount)}</td>}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <BreakdownTable
              title="Mahsulot turlari bo'yicha"
              rows={data.byProductType}
              nameOf={(r) => r.name}
              showFinance={showFinance}
              totalSamples={data.totals.samples}
            />
            <BreakdownTable
              title="Natijalar bo'yicha"
              rows={data.byResult}
              nameOf={(r) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_STYLES[r.result] || ''}`}>
                  {RESULT_LABELS[r.result] || r.result}
                </span>
              )}
              showFinance={showFinance}
              totalSamples={data.totals.samples}
            />
          </div>

          <BreakdownTable
            title={`Buyurtmachilar bo'yicha (eng ko'p ${TOP_BODIES} ta)`}
            rows={topBodies(data.byCertificationBody)}
            nameOf={(r) => r.name}
            showFinance={showFinance}
            totalSamples={data.totals.samples}
          />
        </div>
      )}
    </div>
  );
}
