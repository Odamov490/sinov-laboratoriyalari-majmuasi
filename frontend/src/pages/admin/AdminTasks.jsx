import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Plus, CheckSquare, MessageSquare, Paperclip, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { SearchBar, Select } from '../../components/UI.jsx';
import TaskModal from '../../components/admin/TaskModal.jsx';
import { adminTasks } from '../../services/adminApi';
import { getLaboratories } from '../../services/publicApi';
import { TASK_STATUSES, TASK_PRIORITIES, PRIORITY_BY, formatDue, notifyTasksChanged, apiError } from '../../utils/tasks';

const VIEW_KEY = 'admin.tasks.view';
const DUE_OPTIONS = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: 'Shu hafta' },
  { value: 'overdue', label: "Muddati o'tgan" },
];

const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'kanban';
  } catch {
    return 'kanban';
  }
};

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

function PriorityBadge({ priority }) {
  const p = PRIORITY_BY[priority];
  if (!p) return null;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${p.color}`}>{p.label}</span>;
}

function DueLabel({ task }) {
  if (!task.dueDate) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${task.overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
      <CalendarDays className="h-3.5 w-3.5" />
      {formatDue(task.dueDate)}
    </span>
  );
}

function StatusSelect({ task, onChange, className = '' }) {
  return (
    <select
      value={task.status}
      disabled={!task.permissions.work}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(task, e.target.value)}
      className={`rounded-md border border-border bg-white px-1.5 py-1 text-xs text-ink disabled:opacity-60 ${className}`}
      aria-label="Holat"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function TaskCard({ task, onOpen, onStatus, onDragStart }) {
  return (
    <div
      draggable={task.permissions.work}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onOpen(task.id)}
      className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition hover:shadow-card ${task.overdue ? 'border-red-300' : 'border-border'}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_BY[task.priority]?.dot}`} title={PRIORITY_BY[task.priority]?.label} />
        <p className={`text-sm font-medium ${task.status === 'BAJARILDI' || task.status === 'BEKOR_QILINDI' ? 'text-slate-400 line-through' : 'text-ink'}`}>{task.title}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <DueLabel task={task} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
        {task.checklistTotal > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" /> {task.checklistDone}/{task.checklistTotal}
          </span>
        )}
        {task.commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {task.commentCount}
          </span>
        )}
        {task.attachmentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" /> {task.attachmentCount}
          </span>
        )}
      </div>
      {/* Ijrochilar: F.I.Sh. bilan (bo'lsa). */}
      {task.assignees.length > 0 && (
        <div className="mt-2 space-y-1">
          {task.assignees.map((a) => (
            <div key={a.id} className="flex items-center gap-1.5 text-xs text-slate-600" title={a.fullName}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
                {initials(a.fullName)}
              </span>
              <span className="truncate">{a.fullName}</span>
            </div>
          ))}
        </div>
      )}
      <StatusSelect task={task} onChange={onStatus} className="mt-2 w-full" />
    </div>
  );
}

function Kanban({ tasks, onOpen, onStatus }) {
  const [over, setOver] = useState(null);
  const onDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
      {TASK_STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.value);
            }}
            onDragLeave={() => setOver((v) => (v === col.value ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const task = tasks.find((t) => t.id === e.dataTransfer.getData('text/plain'));
              if (task && task.status !== col.value) onStatus(task, col.value);
            }}
            className={`min-w-[220px] rounded-xl border-t-4 bg-bg-light p-3 ${col.column} ${over === col.value ? 'ring-2 ring-primary/40' : ''}`}
          >
            <p className="mb-3 flex items-center justify-between text-sm font-semibold text-ink">
              {col.label}
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{items.length}</span>
            </p>
            <div className="space-y-2 min-h-[60px]">
              {items.map((t) => (
                <TaskCard key={t.id} task={t} onOpen={onOpen} onStatus={onStatus} onDragStart={onDragStart} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskTable({ tasks, onOpen, onStatus, showLab }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Vazifa</th>
            <th className="px-4 py-3">Holat</th>
            <th className="px-4 py-3">Muhimlik</th>
            <th className="px-4 py-3">Muddat</th>
            <th className="px-4 py-3">Ijrochilar</th>
            {showLab && <th className="px-4 py-3">Laboratoriya</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((t) => (
            <tr key={t.id} onClick={() => onOpen(t.id)} className={`cursor-pointer hover:bg-bg-light ${t.overdue ? 'bg-red-50/60' : ''}`}>
              <td className="px-4 py-3">
                <p className="font-medium text-ink">{t.title}</p>
                <p className="text-xs text-slate-400">{t.creator?.fullName}</p>
              </td>
              <td className="px-4 py-3">
                <StatusSelect task={t} onChange={onStatus} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <DueLabel task={t} />
              </td>
              <td className="px-4 py-3 text-slate-600">{t.assignees.map((a) => a.fullName).join(', ') || '—'}</td>
              {showLab && <td className="px-4 py-3 text-slate-600">{t.laboratory?.nameUz || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminTasks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const seesAll = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);

  const [tab, setTab] = useState('mine');
  const [view, setView] = useState(readView);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [priority, setPriority] = useState('');
  const [due, setDue] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [laboratoryId, setLaboratoryId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quick, setQuick] = useState('');
  const [users, setUsers] = useState([]);
  const [labs, setLabs] = useState([]);
  const [modal, setModal] = useState({ open: false, id: null });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* private mode */
    }
  }, [view]);

  useEffect(() => {
    adminTasks
      .assignableUsers()
      .then((r) => setUsers(r.items))
      .catch(() => {});
    if (seesAll) {
      getLaboratories()
        .then((r) => setLabs(Array.isArray(r) ? r : r.items || []))
        .catch(() => {});
    }
  }, [seesAll]);

  // Bildirishnomadan kelgan havola: /admin/vazifalar?task=<id>
  const linkedTask = params.get('task');
  useEffect(() => {
    if (linkedTask) setModal({ open: true, id: linkedTask });
  }, [linkedTask]);

  const query = useMemo(
    () => ({
      mine: tab === 'mine' ? 1 : undefined,
      q: debouncedQ || undefined,
      priority: priority || undefined,
      due: due || undefined,
      assigneeId: assigneeId || undefined,
      laboratoryId: tab === 'all' && laboratoryId ? laboratoryId : undefined,
      pageSize: 500,
    }),
    [tab, debouncedQ, priority, due, assigneeId, laboratoryId]
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminTasks.list(query);
      setTasks(r.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const changeStatus = async (task, status) => {
    const prev = tasks;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      const updated = await adminTasks.setStatus(task.id, status);
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: updated.status, overdue: updated.overdue } : t)));
      notifyTasksChanged();
    } catch (err) {
      setTasks(prev);
      showToast(apiError(err), 'error');
    }
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    try {
      await adminTasks.create({ title });
      setQuick('');
      notifyTasksChanged();
      load();
    } catch (err) {
      showToast(apiError(err), 'error');
    }
  };

  const openTask = (id) => setModal({ open: true, id });
  const closeModal = () => {
    setModal({ open: false, id: null });
    if (linkedTask) {
      params.delete('task');
      setParams(params, { replace: true });
    }
  };

  const filtered = Boolean(debouncedQ || priority || due || assigneeId || laboratoryId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Vazifalar</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
            <button onClick={() => setView('kanban')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-primary text-white' : 'text-slate-600'}`}>
              <LayoutGrid className="h-4 w-4" /> Kanban
            </button>
            <button onClick={() => setView('list')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${view === 'list' ? 'bg-primary text-white' : 'text-slate-600'}`}>
              <List className="h-4 w-4" /> Ro'yxat
            </button>
          </div>
          <button onClick={() => openTask(null)} className="btn-primary">
            <Plus className="h-4 w-4" /> Yangi vazifa
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'mine', label: 'Mening vazifalarim' },
          ...(seesAll ? [{ key: 'all', label: 'Barchasi' }] : []),
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={quickAdd} className="card flex items-center gap-2 p-3">
        <Plus className="h-4 w-4 text-slate-400" />
        <input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Tezkor vazifa qo'shish — sarlavhani yozib Enter bosing"
          maxLength={300}
        />
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SearchBar value={q} onChange={setQ} placeholder="Vazifalardan qidirish..." />
        </div>
        <Select value={priority} onChange={setPriority} options={TASK_PRIORITIES} placeholder="Barcha muhimlik" />
        <Select value={due} onChange={setDue} options={DUE_OPTIONS} placeholder="Barcha muddatlar" />
        <Select
          value={assigneeId}
          onChange={setAssigneeId}
          options={users.map((u) => ({ value: u.id, label: u.fullName }))}
          placeholder="Barcha ijrochilar"
        />
        {seesAll && tab === 'all' && (
          <Select value={laboratoryId} onChange={setLaboratoryId} options={labs.map((l) => ({ value: l.id, label: l.nameUz }))} placeholder="Barcha laboratoriyalar" />
        )}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} retryLabel="Qayta urinish" />
      ) : tasks.length === 0 ? (
        <EmptyState message={filtered ? 'Filtrga mos vazifa topilmadi.' : "Hozircha vazifa yo'q. Yuqoridan tezkor qo'shing."} />
      ) : view === 'kanban' ? (
        <Kanban tasks={tasks} onOpen={openTask} onStatus={changeStatus} />
      ) : (
        <TaskTable tasks={tasks} onOpen={openTask} onStatus={changeStatus} showLab={tab === 'all'} />
      )}

      <TaskModal open={modal.open} taskId={modal.id} onClose={closeModal} onChanged={load} />
    </div>
  );
}
