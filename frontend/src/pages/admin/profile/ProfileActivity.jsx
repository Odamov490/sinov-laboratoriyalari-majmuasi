import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Package, BookOpen, LogIn, CheckCircle2 } from 'lucide-react';
import { adminProfile } from '../../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../../components/StateViews.jsx';
import { fmtDateTime } from './ProfileGeneral.jsx';

const TYPES = {
  task: { label: 'Vazifalar', icon: ListChecks, tone: 'bg-primary/10 text-primary' },
  sample: { label: 'Namunalar', icon: Package, tone: 'bg-amber-50 text-amber-700' },
  journal: { label: 'Sinov jurnali', icon: BookOpen, tone: 'bg-violet-50 text-violet-700' },
  login: { label: 'Kirishlar', icon: LogIn, tone: 'bg-slate-100 text-slate-600' },
};

// Faqat o'zim bajargan harakatlar (server req.user.sub bo'yicha).
export default function ProfileActivity() {
  const [type, setType] = useState('');
  const [items, setItems] = useState(null);
  const [month, setMonth] = useState(null);
  const [next, setNext] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setItems(null);
    setError(false);
    adminProfile
      .activity({ type: type || undefined, limit: 30 })
      .then((r) => {
        setItems(r.items);
        setHasMore(r.hasMore);
        setNext(r.nextBefore);
        if (r.month) setMonth(r.month);
      })
      .catch(() => setError(true));
  }, [type]);
  useEffect(load, [load]);

  const more = async () => {
    setLoadingMore(true);
    try {
      const r = await adminProfile.activity({ type: type || undefined, limit: 30, before: next });
      setItems((list) => [...list, ...r.items.filter((i) => !list.some((x) => x.id === i.id))]);
      setHasMore(r.hasMore);
      setNext(r.nextBefore);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-5">
      {month && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card flex items-center gap-3 p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-xl font-bold text-ink">{month.doneTasks}</p>
              <p className="text-xs text-slate-500">Shu oy bajarilgan vazifalar</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <Package className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-xl font-bold text-ink">{month.sampleMoves}</p>
              <p className="text-xs text-slate-500">Shu oy namuna harakatlari</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {[['', 'Hammasi'], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button
            key={k || 'all'}
            type="button"
            onClick={() => setType(k)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${type === k ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-border hover:bg-bg-light'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {error ? (
          <ErrorState onRetry={load} />
        ) : !items ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState message="Hozircha harakatlar yo'q." />
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {items.map((i) => {
              const t = TYPES[i.type] || TYPES.login;
              return (
                <li key={i.id} className="relative">
                  <span className={`absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${t.tone}`}>
                    <t.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm text-ink">
                    {i.text}
                    {i.subject &&
                      (i.link ? (
                        <>
                          {': '}
                          <Link to={i.link} className="font-medium text-primary hover:underline">
                            {i.subject}
                          </Link>
                        </>
                      ) : (
                        <span className="text-slate-500"> — {i.subject}</span>
                      ))}
                  </p>
                  <p className="text-xs text-slate-400">{fmtDateTime(i.at)}</p>
                </li>
              );
            })}
          </ol>
        )}
        {items && hasMore && (
          <button type="button" onClick={more} disabled={loadingMore} className="mt-5 w-full rounded-lg border border-border py-2 text-sm font-medium text-primary hover:bg-bg-light">
            {loadingMore ? 'Yuklanmoqda…' : 'Yana yuklash'}
          </button>
        )}
      </div>
    </div>
  );
}
