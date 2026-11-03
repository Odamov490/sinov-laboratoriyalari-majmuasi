import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { updateAdminProfile } from '../../services/adminApi';
import ChangePasswordForm from '../../components/admin/ChangePasswordForm.jsx';
import { roleLabel } from '../../utils/roles';

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-2 text-sm border-b border-border last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ink text-right">{value || '—'}</span>
    </div>
  );
}

const formatDateTime = (v) => (v ? new Date(v).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }) : null);

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user.fullName);
  const [saving, setSaving] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      setUser(await updateAdminProfile({ fullName }));
      showToast('Profil saqlandi.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-ink">Mening profilim</h1>

      <div className="card p-6">
        <Row label="Login" value={user.email} />
        <Row label="Rol" value={roleLabel(user.role)} />
        <Row label="Laboratoriya" value={user.labName} />
        <Row label="Lavozim" value={user.staff?.position} />
        <Row label="Oxirgi kirish" value={formatDateTime(user.lastLoginAt)} />
      </div>

      <form onSubmit={saveName} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">F.I.Sh.</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" required minLength={2} />
        </div>
        <button type="submit" disabled={saving || fullName.trim() === user.fullName} className="btn-secondary">
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>

      <div className="card p-6">
        <p className="mb-4 text-sm font-semibold text-ink">Parolni almashtirish</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
