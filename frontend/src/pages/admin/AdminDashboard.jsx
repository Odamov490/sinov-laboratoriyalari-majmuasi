import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FlaskConical, Wrench, Newspaper } from 'lucide-react';
import { adminApplications, adminResource } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/UI.jsx';
import { Loading } from '../../components/StateViews.jsx';
import { formatDate } from '../../utils/localize';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);

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
