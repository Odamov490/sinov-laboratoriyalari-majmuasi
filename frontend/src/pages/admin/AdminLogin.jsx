import React, { useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { tr } from '../../i18n/tr.js';
import LanguageSwitcher from '../../components/admin/LanguageSwitcher.jsx';

export default function AdminLogin() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Faqat o'z admin sahifalarimizga qaytariladi (tashqi manzilga emas).
  const from = location.state?.from;
  const target = typeof from === 'string' && from.startsWith('/admin/') && !from.startsWith('/admin/login') ? from : '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={target} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // /admin — tanlangan boshlang'ich sahifaga yo'naltiradi (AdminLayout).
      navigate(target, { replace: true });
    } catch (err) {
      showToast(err?.response?.data?.error || tr("Login yoki parol noto'g'ri."), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-8">
        <div className="-mr-4 -mt-4 mb-2 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col items-center mb-6">
          <Logo showTagline className="mb-4" />
          <h1 className="font-bold text-lg text-ink">{t('admin.login')}</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Login = email; a bare name ("axror") is completed with the
              login domain by the server, so the full address is optional. */}
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-ink mb-1.5">
              {tr('Login')}
            </label>
            <input
              id="login"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ism@slm.uz"
              className="input-field"
            />
          </div>
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
