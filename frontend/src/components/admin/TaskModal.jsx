import React, { useEffect, useState } from 'react';
import { Trash2, Paperclip, Send, Plus, X, History } from 'lucide-react';
import { Modal, ConfirmDialog } from '../Modal.jsx';
import { Loading, ErrorState } from '../StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminTasks, uploadFiles } from '../../services/adminApi';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_RELATED_TYPES,
  STATUS_BY,
  RELATED_BY,
  formatDateTime,
  notifyTasksChanged,
  apiError,
} from '../../utils/tasks';

const EMPTY = { title: '', description: '', priority: 'ORTACHA', dueDate: '', assigneeIds: [], relatedType: '', relatedLabel: '' };

const toForm = (t) => ({
  title: t.title,
  description: t.description || '',
  priority: t.priority,
  dueDate: t.dueDate || '',
  assigneeIds: t.assignees.map((a) => a.id),
  relatedType: t.relatedType || '',
  relatedLabel: t.relatedLabel || '',
});

const STATUS_NAME = (s) => STATUS_BY[s]?.label || s;

function activityText(a, userName) {
  const m = a.meta || {};
  switch (a.action) {
    case 'CREATED':
      return 'vazifani yaratdi';
    case 'UPDATED':
      return "ma'lumotlarni o'zgartirdi";
    case 'STATUS':
      return `holatni o'zgartirdi: ${STATUS_NAME(m.from)} → ${STATUS_NAME(m.to)}`;
    case 'ASSIGNED': {
      const parts = [];
      if (m.added?.length) parts.push(`qo'shdi: ${m.added.map(userName).join(', ')}`);
      if (m.removed?.length) parts.push(`olib tashladi: ${m.removed.map(userName).join(', ')}`);
      return `ijrochilarni ${parts.join('; ') || "o'zgartirdi"}`;
    }
    case 'COMMENT':
      return 'izoh yozdi';
    case 'CHECKLIST':
      if (m.added) return `bandni qo'shdi: «${m.added}»`;
      if (m.checked) return `bandni bajardi: «${m.checked}»`;
      if (m.unchecked) return `bandni qaytardi: «${m.unchecked}»`;
      return "ro'yxatni o'zgartirdi";
    case 'ATTACHMENT':
      return m.added ? `fayl qo'shdi: ${m.added}` : `faylni o'chirdi: ${m.removed}`;
    case 'DELETED':
      return "vazifani o'chirdi";
    default:
      return a.action;
  }
}

function AssigneePicker({ users, value, onChange, disabled }) {
  const [adding, setAdding] = useState('');
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const options = users.filter((u) => !value.includes(u.id));
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-sm text-slate-400">Tayinlanmagan</span>}
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {byId[id]?.fullName || 'Foydalanuvchi'}
            {!disabled && (
              <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} aria-label="Olib tashlash">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && options.length > 0 && (
        <select
          value={adding}
          onChange={(e) => {
            if (e.target.value) onChange([...value, e.target.value]);
            setAdding('');
          }}
          className="input-field mt-2"
        >
          <option value="">+ Ijrochi qo'shish</option>
          {options.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
              {u.laboratoryName ? ` — ${u.laboratoryName}` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

// Vazifa oynasi: taskId bo'lmasa — yangi vazifa, bo'lsa — to'liq ko'rinish.
export default function TaskModal({ open, taskId, onClose, onChanged }) {
  const { showToast } = useToast();
  const [currentId, setCurrentId] = useState(taskId);
  const [task, setTask] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentId(taskId);
    setTask(null);
    setForm(EMPTY);
    setError(null);
    adminTasks
      .assignableUsers()
      .then((r) => setUsers(r.items))
      .catch(() => setUsers([]));
  }, [open, taskId]);

  const load = async (id = currentId) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const t = await adminTasks.get(id);
      setTask(t);
      setForm(toForm(t));
    } catch (err) {
      setError(err?.response?.status === 404 ? 'Vazifa topilmadi yoki sizga ko\'rinmaydi.' : apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && currentId) load(currentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentId]);

  const changed = (t) => {
    if (t) {
      setTask(t);
      setForm(toForm(t));
    }
    notifyTasksChanged();
    onChanged?.();
  };

  const run = async (fn, okMessage) => {
    try {
      const res = await fn();
      if (okMessage) showToast(okMessage, 'success');
      return res;
    } catch (err) {
      showToast(apiError(err), 'error');
      return undefined;
    }
  };

  const payload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    priority: form.priority,
    dueDate: form.dueDate || null,
    assigneeIds: form.assigneeIds,
    relatedType: form.relatedType || null,
    relatedLabel: form.relatedLabel.trim() || null,
  });

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    if (!currentId) {
      const t = await run(() => adminTasks.create(payload()), 'Vazifa yaratildi.');
      if (t) {
        setCurrentId(t.id);
        changed(t);
      }
    } else {
      const t = await run(() => adminTasks.update(currentId, payload()), 'Saqlandi.');
      if (t) changed(t);
    }
    setSaving(false);
  };

  const setStatus = async (status) => {
    const t = await run(() => adminTasks.setStatus(currentId, status));
    if (t) changed(t);
  };

  const remove = async () => {
    const ok = await run(() => adminTasks.remove(currentId), "Vazifa o'chirildi.");
    if (ok !== undefined) {
      notifyTasksChanged();
      onChanged?.();
      onClose();
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    if (await run(() => adminTasks.addChecklistItem(currentId, newItem.trim()))) {
      setNewItem('');
      await load();
      onChanged?.();
    }
  };

  const toggleItem = async (item) => {
    if (await run(() => adminTasks.updateChecklistItem(currentId, item.id, { done: !item.done }))) {
      await load();
      onChanged?.();
    }
  };

  const removeItem = async (item) => {
    if ((await run(() => adminTasks.removeChecklistItem(currentId, item.id))) !== undefined) {
      await load();
      onChanged?.();
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (await run(() => adminTasks.addComment(currentId, comment.trim()))) {
      setComment('');
      await load();
      notifyTasksChanged();
    }
  };

  const attach = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const { files } = await uploadFiles(fileList);
      for (const f of files) {
        await adminTasks.addAttachment(currentId, { fileUrl: f.url, fileName: f.originalName });
      }
      showToast('Fayl biriktirildi.', 'success');
      await load();
      onChanged?.();
    } catch (err) {
      showToast(apiError(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (att) => {
    if ((await run(() => adminTasks.removeAttachment(currentId, att.id))) !== undefined) await load();
  };

  const isNew = !currentId;
  const canManage = isNew || task?.permissions?.manage;
  const canWork = isNew || task?.permissions?.work;
  const userName = (id) => users.find((u) => u.id === id)?.fullName || task?.assignees.find((u) => u.id === id)?.fullName || 'foydalanuvchi';
  // Ijrochi ro'yxatida tanlash mumkin bo'lmaganlar ham (masalan boshqa
  // laboratoriyadan menejer qo'shgan) nomi bilan ko'rinsin.
  const pickerUsers = [...users, ...(task?.assignees || []).filter((a) => !users.some((u) => u.id === a.id))];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Yangi vazifa' : 'Vazifa'} size="xl">
      {error ? (
        <ErrorState message={error} onRetry={() => load()} retryLabel="Qayta urinish" />
      ) : (loading || currentId) && !task ? (
        // Mavjud vazifa hali yuklanmagan — forma faqat ma'lumot kelgach chiziladi.
        <Loading />
      ) : (
        <div className="space-y-5">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Sarlavha *</label>
              <input value={form.title} onChange={set('title')} className="input-field" required maxLength={300} disabled={!canManage} autoFocus={isNew} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Tavsif</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className="input-field" disabled={!canManage} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Holat</label>
                {isNew ? (
                  <p className="py-2 text-sm text-slate-500">Yangi</p>
                ) : (
                  <select value={task.status} onChange={(e) => setStatus(e.target.value)} className="input-field" disabled={!canWork}>
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Muhimlik</label>
                <select value={form.priority} onChange={set('priority')} className="input-field" disabled={!canManage}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Muddat</label>
                <input type="date" value={form.dueDate} onChange={set('dueDate')} className={`input-field ${task?.overdue ? '!border-red-400 text-red-600' : ''}`} disabled={!canManage} />
                {task?.overdue && <p className="mt-1 text-xs font-medium text-red-600">Muddati o'tgan</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Ijrochilar</label>
              <AssigneePicker users={pickerUsers} value={form.assigneeIds} onChange={(ids) => setForm((f) => ({ ...f, assigneeIds: ids }))} disabled={!canManage} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Bog'liq bo'lim</label>
                <select value={form.relatedType} onChange={set('relatedType')} className="input-field" disabled={!canManage}>
                  <option value="">—</option>
                  {TASK_RELATED_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">Bog'liq hujjat (raqam yoki nom)</label>
                <input value={form.relatedLabel} onChange={set('relatedLabel')} className="input-field" placeholder="masalan: Ariza №125" maxLength={300} disabled={!canManage} />
              </div>
            </div>
            {task && (
              <p className="text-xs text-slate-400">
                Yaratdi: {task.creator?.fullName} · {formatDateTime(task.createdAt)}
                {task.laboratory ? ` · ${task.laboratory.nameUz}` : ''}
                {task.relatedType && !canManage ? ` · ${RELATED_BY[task.relatedType]?.label}` : ''}
                {task.completedAt ? ` · Bajarildi: ${formatDateTime(task.completedAt)}` : ''}
              </p>
            )}
            {canManage && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="submit" disabled={saving || !form.title.trim()} className="btn-primary">
                  {saving ? 'Saqlanmoqda...' : isNew ? 'Yaratish' : 'Saqlash'}
                </button>
                {!isNew && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline">
                    <Trash2 className="h-4 w-4" /> O'chirish
                  </button>
                )}
              </div>
            )}
          </form>

          {task && (
            <>
              <Section title={`Bajariladigan ishlar (${task.checklist.filter((c) => c.done).length}/${task.checklist.length})`}>
                <ul className="space-y-1">
                  {task.checklist.map((item) => (
                    <li key={item.id} className="group flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={item.done} onChange={() => toggleItem(item)} disabled={!canWork} className="h-4 w-4 rounded border-border" />
                      <span className={item.done ? 'text-slate-400 line-through' : 'text-ink'}>{item.text}</span>
                      {canWork && (
                        <button onClick={() => removeItem(item)} className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600" aria-label="O'chirish">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {canWork && (
                  <form onSubmit={addItem} className="mt-2 flex gap-2">
                    <input value={newItem} onChange={(e) => setNewItem(e.target.value)} className="input-field" placeholder="Yangi band..." maxLength={500} />
                    <button type="submit" className="btn-secondary !px-3" aria-label="Qo'shish">
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </Section>

              <Section
                title={`Fayllar (${task.attachments.length})`}
                right={
                  canWork && (
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
                      <Paperclip className="h-4 w-4" /> {uploading ? 'Yuklanmoqda...' : 'Fayl biriktirish'}
                      <input type="file" multiple className="hidden" disabled={uploading} onChange={(e) => attach(e.target.files).then(() => (e.target.value = ''))} />
                    </label>
                  )
                }
              >
                {task.attachments.length === 0 ? (
                  <p className="text-sm text-slate-400">Fayl yo'q.</p>
                ) : (
                  <ul className="space-y-1">
                    {task.attachments.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {f.fileName}
                        </a>
                        <span className="text-xs text-slate-400">{f.uploadedBy?.fullName}</span>
                        {canWork && (
                          <button onClick={() => removeAttachment(f)} className="ml-auto text-slate-400 hover:text-red-600" aria-label="O'chirish">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title={`Izohlar (${task.comments.length})`}>
                <div className="space-y-3">
                  {task.comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-bg-light px-3 py-2">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-ink">{c.author?.fullName}</span> · {formatDateTime(c.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendComment} className="mt-3 flex gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendComment(e);
                    }}
                    rows={2}
                    className="input-field"
                    placeholder="Izoh yozing... (Ctrl+Enter — yuborish)"
                    maxLength={5000}
                  />
                  <button type="submit" disabled={!comment.trim()} className="btn-primary !px-3 self-end" aria-label="Yuborish">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </Section>

              <Section title="Tarix" right={<History className="h-4 w-4 text-slate-400" />}>
                <ul className="space-y-1.5">
                  {task.activities.map((a) => (
                    <li key={a.id} className="text-xs text-slate-500">
                      <span className="text-slate-400">{formatDateTime(a.createdAt)}</span> —{' '}
                      <span className="font-medium text-ink">{a.user?.fullName || "O'chirilgan foydalanuvchi"}</span> {activityText(a, userName)}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Vazifani o'chirish"
        message={`«${task?.title}» vazifasi o'chiriladi. Davom etasizmi?`}
      />
    </Modal>
  );
}
