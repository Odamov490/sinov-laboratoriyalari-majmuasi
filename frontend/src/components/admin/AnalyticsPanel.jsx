import React, { useEffect, useState } from 'react';
import { Users, Eye, Activity, RefreshCw, CalendarRange } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { getAnalyticsOverview } from '../../services/adminApi';
import { Loading, ErrorState } from '../StateViews.jsx';
import { formatDate } from '../../utils/localize';

const NAVY = '#0B3A63';
const GOLD = '#D9A441';
const EMERALD = '#10B981';

const toDateStr = (d) => d.toISOString().slice(0, 10);
const todayUTC = () => new Date(new Date().toISOString().slice(0, 10));

function presetRange(key) {
  const end = todayUTC();
  const start = todayUTC();
  if (key === 'today') return { start: toDateStr(end), end: toDateStr(end) };
  if (key === 'yesterday') {
    start.setUTCDate(start.getUTCDate() - 1);
    return { start: toDateStr(start), end: toDateStr(start) };
  }
  const daysBack = { '7d': 6, '30d': 29, '90d': 89 }[key] ?? 29;
  start.setUTCDate(start.getUTCDate() - daysBack);
  return { start: toDateStr(start), end: toDateStr(end) };
}

const PRESETS = [
  { key: 'today', label: 'Bugun' },
  { key: 'yesterday', label: 'Kecha' },
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: '90d', label: '90 kun' },
  { key: 'custom', label: 'Maxsus oraliq' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AnalyticsPanel() {
  const [preset, setPreset] = useState('30d');
  const [customStart, setCustomStart] = useState(presetRange('30d').start);
  const [customEnd, setCustomEnd] = useState(presetRange('30d').end);
  const [range, setRange] = useState(presetRange('30d'));
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | not-configured | error

  const load = (r) => {
    setStatus('loading');
    getAnalyticsOverview(r)
      .then((res) => {
        setData(res);
        setStatus('ready');
      })
      .catch((err) => {
        setStatus(err?.response?.status === 503 ? 'not-configured' : 'error');
      });
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const selectPreset = (key) => {
    setPreset(key);
    if (key === 'custom') return;
    const r = presetRange(key);
    setCustomStart(r.start);
    setCustomEnd(r.end);
    setRange(r);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd || customStart > customEnd) return;
    setRange({ start: customStart, end: customEnd });
  };

  const cacheData = data
    ? [
        { name: 'Keshdan', value: data.totals.cachedRequests, color: EMERALD },
        { name: 'To\'g\'ridan-to\'g\'ri', value: Math.max(data.totals.requests - data.totals.cachedRequests, 0), color: NAVY },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-ink">Saytdan foydalanish statistikasi</h2>
        <button
          onClick={() => load(range)}
          disabled={status === 'loading'}
          className="btn-secondary !py-1.5 !px-3 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} /> Yangilash
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => selectPreset(p.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
              preset === p.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-border hover:bg-bg-light'
            }`}
          >
            {p.label}
          </button>
        ))}

        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-field !py-1.5 !w-auto text-xs"
            />
            <span className="text-slate-400 text-xs">—</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={toDateStr(todayUTC())}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input-field !py-1.5 !w-auto text-xs"
            />
            <button onClick={applyCustom} className="btn-primary !py-1.5 !px-3 text-xs">
              Qo'llash
            </button>
          </div>
        )}
      </div>

      {status === 'loading' && <Loading />}

      {status === 'not-configured' && (
        <div className="card p-6 text-center text-sm text-slate-500">
          Cloudflare Analytics hali ulanmagan.
        </div>
      )}

      {status === 'error' && (
        <div className="card">
          <ErrorState message="Statistikani olishda xatolik yuz berdi." onRetry={() => load(range)} retryLabel="Qayta urinish" />
        </div>
      )}

      {status === 'ready' && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            {[
              { label: 'Noyob tashrifchilar', value: data.totals.uniqueVisitors, icon: Users },
              { label: 'Sahifa ko‘rishlar', value: data.totals.pageViews, icon: Eye },
              { label: 'Jami so‘rovlar', value: data.totals.requests, icon: Activity },
            ].map((c) => (
              <div key={c.label} className="card p-6 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <c.icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-ink">{c.value.toLocaleString('uz-UZ')}</p>
                  <p className="text-sm text-slate-500">{c.label}</p>
                </div>
              </div>
            ))}
          </div>

          {data.dailyStats.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500">
              Tanlangan oraliq uchun ma'lumot topilmadi.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-6">
                <p className="text-sm font-semibold text-ink mb-3">Kunlik tashrifchilar va sahifa ko'rishlar</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.dailyStats} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 10 }} interval={tickInterval(data.dailyStats.length)} angle={-30} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(d) => formatDate(d)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="uniqueVisitors" stroke={NAVY} name="Noyob tashrifchilar" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pageViews" stroke={GOLD} name="Sahifa ko'rishlar" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <p className="text-sm font-semibold text-ink mb-3">Kunlik so'rovlar soni</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.dailyStats} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 10 }} interval={tickInterval(data.dailyStats.length)} angle={-30} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(d) => formatDate(d)} />
                    <Bar dataKey="requests" fill={NAVY} name="So'rovlar" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <p className="text-sm font-semibold text-ink mb-3">Kunlik trafik hajmi</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.dailyStats} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 10 }} interval={tickInterval(data.dailyStats.length)} angle={-30} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(v) => formatBytes(v)} tick={{ fontSize: 11 }} width={60} />
                    <Tooltip labelFormatter={(d) => formatDate(d)} formatter={(v) => formatBytes(v)} />
                    <Area type="monotone" dataKey="bytes" stroke={GOLD} fill={GOLD} fillOpacity={0.2} name="Trafik" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <p className="text-sm font-semibold text-ink mb-3">Kesh nisbati (jami so'rovlar)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={cacheData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {cacheData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString('uz-UZ')} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function tickInterval(len) {
  return Math.max(0, Math.ceil(len / 8) - 1);
}
