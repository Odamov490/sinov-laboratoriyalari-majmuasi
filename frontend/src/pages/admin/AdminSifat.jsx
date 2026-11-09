import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminResource } from '../../services/adminApi';
import { Loading, EmptyState } from '../../components/StateViews.jsx';
import { SMK_MODULES, smkItemsForLab } from '../../layouts/AdminLayout.jsx';
import { smkConfinedLabId } from './AdminSmkPage.jsx';
import { tr } from '../../i18n/tr.js';

// Sifat bo'limi: har bir laboratoriya — kanban ustuni, ichida uning SMK
// 10 ta asosiy (core) SMK moduli kartochka sifatida (bosilganda /admin/smk/<lab>/<modul> ochiladi).
export default function AdminSifat() {
  const { user } = useAuth();
  const [labs, setLabs] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items || []))
      .catch(() => setLabs([]));
  }, []);

  const modules = useMemo(() => SMK_MODULES.filter((m) => m.core && m.roles.includes(user.role)), [user.role]);
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => modules.filter((m) => !q || m.label.toLowerCase().includes(q)), [modules, q]);

  if (labs === null) return <Loading />;
  const confinedId = smkConfinedLabId(user);
  const shownLabs = confinedId ? labs.filter((l) => l.id === confinedId) : labs;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{tr('Sifat menejmenti: laboratoriyalar')}</h1>
          <p className="mt-1 text-sm text-slate-500">{tr("Laboratoriyani tanlang va kerakli SMK bo'limini oching.")}</p>
        </div>
        <label className="relative block w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Modul qidirish')}
            className="input-field w-full !pl-9"
          />
        </label>
      </div>

      {shownLabs.length === 0 || modules.length === 0 ? (
        <EmptyState message={tr('Laboratoriya topilmadi.')} />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4">
          {shownLabs.map((lab) => (
            <section key={lab.id} className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-slate-50">
              <header className="flex items-start gap-2 rounded-t-xl border-b border-border bg-white px-4 py-3">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <h2 className="flex-1 text-sm font-semibold leading-snug text-ink">{lab.nameUz}</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{visible.length}</span>
              </header>
              <div className="flex flex-col gap-2 p-3">
                {smkItemsForLab(lab.slug, visible).map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition hover:border-primary/40 hover:shadow"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-primary" />
                  </Link>
                ))}
                {visible.length === 0 && <p className="px-1 py-2 text-xs text-slate-400">—</p>}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
