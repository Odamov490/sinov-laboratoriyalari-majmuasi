import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FlaskConical, Wrench, Newspaper, Clock, TrendingUp } from 'lucide-react';
import { adminApplications, adminResource, getMyDashboard } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/UI.jsx';
import { Loading } from '../../components/StateViews.jsx';
import AnalyticsPanel from '../../components/admin/AnalyticsPanel.jsx';
import { formatDate } from '../../utils/localize';

function greeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Xayrli tong';
  if (h >= 12 && h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'hozirgina';
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [myDashboard, setMyDashboard] = useState(null);

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

    if (user.role !== 'SUPER_ADMIN') {
      getMyDashboard().then(setMyDashboard).catch(() => setMyDashboard({ roleStats: [], recentActivity: [] }));
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
      <h1 className="text-2xl font-bold text-ink mb-1">{`${greeting()}, ${user.fullName}!`}</h1>
      <p className="text-sm text-slate-500 mb-8">{user.role}</p>

      {user.role === 'SUPER_ADMIN' && (
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
      )}

      {user.role !== 'SUPER_ADMIN' && (
        <div>
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Sizning faoliyatingiz
          </h2>

          {myDashboard === null ? (
            <Loading />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {myDashboard.roleStats.map((s) => (
                  <div key={s.label} className="card p-6">
                    <p className="text-2xl font-bold text-ink">{s.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="card p-6">
                <p className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> So'nggi faoliyat
                </p>
                {myDashboard.recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-400">Hali faoliyat qayd etilmagan.</p>
                ) : (
                  <div className="space-y-2">
                    {myDashboard.recentActivity.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                        <span className="text-ink">Siz {a.text}</span>
                        <span className="text-slate-400 text-xs shrink-0 ml-3">{relativeTime(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {user.role === 'SUPER_ADMIN' && (
        <div className="mt-10">
          <AnalyticsPanel />
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
