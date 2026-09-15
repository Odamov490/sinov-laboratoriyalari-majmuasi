import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FlaskConical, Wrench, Newspaper, Users, Eye, Activity, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApplications, adminResource, getAnalyticsOverview } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/UI.jsx';
import { Loading, ErrorState } from '../../components/StateViews.jsx';
import { formatDate } from '../../utils/localize';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsStatus, setAnalyticsStatus] = useState('loading'); // loading | ready | not-configured | error

  const loadAnalytics = () => {
    setAnalyticsStatus('loading');
    getAnalyticsOverview()
      .then((data) => {
        setAnalytics(data);
        setAnalyticsStatus('ready');
      })
      .catch((err) => {
        setAnalyticsStatus(err?.response?.status === 503 ? 'not-configured' : 'error');
      });
  };

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN') loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

  useEffect(() => {
    const canApplications = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);
    const canLabs = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);
    const canNews = ['SUPER_ADMIN', 'EDITOR'].includes(user.role);

    Promise.all([
      canApplications ? adminApplications.list({ pageSize: 1 }) : Promise.resolve({ total: 0 }),
      canLabs ? adminResource('laboratories').list({ pageSize: 1 }) : Promise.resolve({ total: 0 }),
      canLabs ? adminResource('services').list({ pageSize: 1 }) : Promise.resolve({ total: 0 }),
      canNews ? adminResource('news').list({ pageSize: 1 }) : Promise.resolve({ total: 0 }),
    ]).then(([apps, labs, services, news]) => {
      setStats({ applications: apps.total, laboratories: labs.total, services: services.total, news: news.total });
    });

    if (canApplications) {
      adminApplications.list({ pageSize: 5 }).then((d) => setRecent(d.items));
    } else {
      setRecent([]);
    }
  }, [user.role]);

  const cards = [
    { label: 'Arizalar', value: stats?.applications, icon: Inbox, to: '/admin/arizalar' },
    { label: 'Laboratoriyalar', value: stats?.laboratories, icon: FlaskConical, to: '/admin/laboratoriyalar' },
    { label: 'Xizmatlar', value: stats?.services, icon: Wrench, to: '/admin/xizmatlar' },
    { label: 'Yangiliklar', value: stats?.news, icon: Newspaper, to: '/admin/yangiliklar' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">{`Xush kelibsiz, ${user.fullName}`}</h1>
      <p className="text-sm text-slate-500 mb-8">{user.role}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <c.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold text-ink">{c.value ?? '—'}</p>
              <p className="text-sm text-slate-500">{c.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {user.role === 'SUPER_ADMIN' && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Saytdan foydalanish statistikasi</h2>
            <button
              onClick={loadAnalytics}
              disabled={analyticsStatus === 'loading'}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${analyticsStatus === 'loading' ? 'animate-spin' : ''}`} /> Yangilash
            </button>
          </div>

          {analyticsStatus === 'loading' && <Loading />}

          {analyticsStatus === 'not-configured' && (
            <div className="card p-6 text-center text-sm text-slate-500">
              Cloudflare Analytics hali ulanmagan.
            </div>
          )}

          {analyticsStatus === 'error' && (
            <div className="card">
              <ErrorState message="Statistikani olishda xatolik yuz berdi." onRetry={loadAnalytics} retryLabel="Qayta urinish" />
            </div>
          )}

          {analyticsStatus === 'ready' && analytics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                {[
                  { label: 'Noyob tashrifchilar (30 kun)', value: analytics.totals.uniqueVisitors, icon: Users },
                  { label: 'Sahifa ko‘rishlar', value: analytics.totals.pageViews, icon: Eye },
                  { label: 'Jami so‘rovlar', value: analytics.totals.requests, icon: Activity },
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

              {analytics.dailyStats.length > 0 && (
                <div className="card p-6">
                  <p className="text-sm font-semibold text-ink mb-3">Kunlik noyob tashrifchilar</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={analytics.dailyStats} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => formatDate(d)}
                        tick={{ fontSize: 10 }}
                        interval={Math.max(0, Math.ceil(analytics.dailyStats.length / 8) - 1)}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip labelFormatter={(d) => formatDate(d)} />
                      <Line type="monotone" dataKey="uniqueVisitors" stroke="#0B3A63" name="Noyob tashrifchilar" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {recent && recent.length > 0 && (
        <div className="mt-10 card overflow-x-auto">
          <div className="px-5 py-4 border-b border-border font-semibold text-ink">So‘nggi arizalar</div>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Raqam</th>
                <th className="px-4 py-3">Mijoz</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-mono text-primary">{a.applicationNumber}</td>
                  <td className="px-4 py-3">{a.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recent === null && <Loading />}
    </div>
  );
}
