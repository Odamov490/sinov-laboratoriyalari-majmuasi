import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminUsers, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { Select } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EDITOR', label: 'Editor' },
];

export default function AdminUsers() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [labs, setLabs] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', role: 'EDITOR', labId: '' });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: 'EDITOR', isActive: true, password: '', labId: '' });

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setError(false);
    adminUsers.list().then(setData).catch(() => setError(true));
  };

  useEffect(load, []);
  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  const labOptions = labs.map((l) => ({ value: l.id, label: l.nameUz }));

  const openCreate = () => {
    setCreateForm({ fullName: '', email: '', password: '', role: 'EDITOR', labId: '' });
    setCreateOpen(true);
  };

  const createUser = async () => {
    setSaving(true);
    try {
      const payload = { ...createForm, labId: createForm.role === 'MANAGER' ? createForm.labId || null : null };
      await adminUsers.create(payload);
      showToast('Foydalanuvchi yaratildi.', 'success');
      setCreateOpen(false);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, role: user.role, isActive: user.isActive, password: '', labId: user.labId || '' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: editForm.fullName,
        role: editForm.role,
        isActive: editForm.isActive,
        labId: editForm.role === 'MANAGER' ? editForm.labId || null : null,
      };
      if (editForm.password) payload.password = editForm.password;
      await adminUsers.update(editingUser.id, payload);
      showToast('Yangilandi.', 'success');
      setEditingUser(null);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await adminUsers.remove(id);
      showToast("O'chirildi.", 'success');
      load();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Foydalanuvchilar</h1>
        <button onClick={openCreate} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Qo'shish
        </button>
      </div>

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState onRetry={load} /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Laboratoriya</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3 text-slate-500">{u.labName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${u.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {u.isActive ? 'Faol' : 'Faol emas'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-bg-light text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi foydalanuvchi" size="sm">
        <div className="space-y-4">
          <input
            placeholder="F.I.Sh."
            value={createForm.fullName}
            onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Parol (kamida 8 belgi)"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            className="input-field"
          />
          <Select
            value={createForm.role}
            onChange={(v) => setCreateForm({ ...createForm, role: v })}
            placeholder="Rol"
            options={ROLES}
          />
          {createForm.role === 'MANAGER' && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Laboratoriya</label>
              <Select
                value={createForm.labId}
                onChange={(v) => setCreateForm({ ...createForm, labId: v })}
                placeholder="Laboratoriyani tanlang"
                options={labOptions}
              />
            </div>
          )}
          <button onClick={createUser} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Foydalanuvchini tahrirlash" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">F.I.Sh.</label>
            <input
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Rol</label>
            <Select
              value={editForm.role}
              onChange={(v) => setEditForm({ ...editForm, role: v })}
              placeholder="Rol"
              options={ROLES}
            />
          </div>
          {editForm.role === 'MANAGER' && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Laboratoriya</label>
              <Select
                value={editForm.labId}
                onChange={(v) => setEditForm({ ...editForm, labId: v })}
                placeholder="Laboratoriyani tanlang"
                options={labOptions}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary"
            />
            Faol
          </label>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Yangi parol (ixtiyoriy, o'zgartirmasangiz bo'sh qoldiring)
            </label>
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="input-field"
              placeholder="Kamida 8 belgi"
            />
          </div>
          <button onClick={saveEdit} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        message="Ushbu foydalanuvchini o'chirmoqchimisiz?"
      />
    </div>
  );
}