import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { updateAdminProfile } from '../../services/adminApi';

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user.fullName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showToast("Yangi parollar bir xil emas.", 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { fullName };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const updated = await updateAdminProfile(payload);
      setUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Profil saqlandi.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-ink mb-1">Mening profilim</h1>
      <p className="text-sm text-slate-500 mb-6">{user.email} — {user.role}</p>

      <form onSubmit={save} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">F.I.Sh.</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" required minLength={2} />
        </div>

        <div className="border-t border-border pt-5 space-y-4">
          <p className="text-sm font-semibold text-ink">Parolni o'zgartirish</p>
          <p className="text-xs text-slate-400 -mt-2">Parolni o'zgartirmoqchi bo'lmasangiz, quyidagi maydonlarni bo'sh qoldiring.</p>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Joriy parol</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Yangi parol</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Yangi parolni tasdiqlash</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}
