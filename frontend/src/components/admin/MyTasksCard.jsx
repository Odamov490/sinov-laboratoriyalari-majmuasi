import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, AlertTriangle, CalendarDays, ArrowRight } from 'lucide-react';
import { adminTasks } from '../../services/adminApi';
import { Loading } from '../StateViews.jsx';
import { PRIORITY_BY, STATUS_BY, formatDue } from '../../utils/tasks';

// Dashboard: eng yaqin muddatli 5 ta ochiq vazifa va muddati o'tganlar soni.
export default function MyTasksCard() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = () =>
      adminTasks
        .mySummary()
        .then((d) => {
          setData(d);
          setFailed(false);
        })
        .catch(() => setFailed(true));
    load();
    window.addEventListener('tasks:changed', load);
    return () => window.removeEventListener('tasks:changed', load);
  }, []);

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ListChecks className="h-4 w-4 text-primary" /> Mening vazifalarim
          {data && <span className="rounded-full bg-bg-light px-2 py-0.5 text-xs text-slate-500">{data.openCount} ta ochiq</span>}
        </p>
        {data?.overdueCount > 0 && (
          <Link to="/admin/vazifalar" className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Muddati o'tgan: {data.overdueCount}
          </Link>
        )}
      </div>

      {failed ? (
        <p className="text-sm text-slate-400">Vazifalarni yuklab bo'lmadi.</p>
      ) : !data ? (
        <Loading />
      ) : data.upcoming.length === 0 ? (
        <p className="text-sm text-slate-400">Ochiq vazifangiz yo'q.</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.upcoming.map((t) => (
            <li key={t.id}>
              <Link to={`/admin/vazifalar?task=${t.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:bg-bg-light">
                <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_BY[t.priority]?.dot}`} title={PRIORITY_BY[t.priority]?.label} />
                <span className="flex-1 truncate text-ink">{t.title}</span>
                <span className={`hidden rounded-full px-2 py-0.5 text-[11px] sm:inline ${STATUS_BY[t.status]?.color}`}>{STATUS_BY[t.status]?.label}</span>
                {t.dueDate && (
                  <span className={`inline-flex shrink-0 items-center gap-1 text-xs ${t.overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDue(t.dueDate)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/admin/vazifalar" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        Barcha vazifalar <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
