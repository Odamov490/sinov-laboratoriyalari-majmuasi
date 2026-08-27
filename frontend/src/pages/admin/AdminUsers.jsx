import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminUsers } from '../../services/adminApi';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'EDITOR' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setError(false);
    adminUsers.list().then(setData).catch(() => setError(true));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({ fullName: '', email: '', password: '', role: 'EDITOR' });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminUsers.create(form);
      showToast('Foydalanuvchi yaratildi.', 'success');
      setModalOpen(false);
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
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setConfirmDelete(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi foydalanuvchi" size="sm">
        <div className="space-y-4">
          <input placeholder="F.I.Sh." value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-field" />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          <input placeholder="Parol (kamida 8 belgi)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
          <Select value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="Rol" options={ROLES} />
          <button onClick={save} disabled={saving} className="btn-primary w-full">
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
