import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminLogin() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Email yoki parol noto‘g‘ri.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-8">
        <div className="flex flex-col items-center mb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-3">
            <FlaskConical className="h-6 w-6" />
          </span>
          <h1 className="font-bold text-lg text-ink">{t('admin.login')}</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('admin.email')}
            className="input-field"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('admin.password')}
            className="input-field"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn className="h-4 w-4" /> {t('admin.login')}
          </button>
        </form>
      </div>
    </div>
  );
}
