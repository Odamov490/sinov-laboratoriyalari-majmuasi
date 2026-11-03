import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { changePassword } from '../../services/adminApi';

// Same rule as the backend (utils/accounts passwordSchema).
export function passwordProblem(password) {
  if (password.length < 10) return "Parol kamida 10 belgidan iborat bo'lishi kerak.";
  if (!/\p{L}/u.test(password)) return "Parolda kamida bitta harf bo'lishi kerak.";
  if (!/\d/.test(password)) return "Parolda kamida bitta raqam bo'lishi kerak.";
  return null;
}

// Old password + new (min 10 chars, a letter and a digit, different from the
// old one) + confirmation. Used on the forced first-login screen and in
// "Mening profilim".
export default function ChangePasswordForm({ onDone, submitLabel = "Parolni almashtirish" }) {
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const problem = next ? passwordProblem(next) || (next === current ? 'Yangi parol joriy paroldan farq qilishi kerak.' : null) : null;
  const mismatch = confirm && next !== confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (problem || mismatch || !current || !next) return;
    setSaving(true);
    try {
      const res = await changePassword(current, next);
      setUser(res.user);
      setCurrent('');
      setNext('');
      setConfirm('');
      showToast('Parol almashtirildi.', 'success');
      onDone?.();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Joriy (vaqtinchalik) parol</label>
        <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="input-field" autoComplete="current-password" />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Yangi parol</label>
        <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className="input-field" autoComplete="new-password" />
        <p className={`mt-1 text-xs ${problem ? 'text-red-600' : 'text-slate-400'}`}>{problem || 'Kamida 10 belgi, harf va raqam bo\'lishi kerak.'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Yangi parolni tasdiqlash</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" autoComplete="new-password" />
        {mismatch && <p className="mt-1 text-xs text-red-600">Parollar bir xil emas.</p>}
      </div>
      <button type="submit" disabled={saving || Boolean(problem) || mismatch} className="btn-primary w-full">
        {saving ? 'Saqlanmoqda...' : submitLabel}
      </button>
    </form>
  );
}
