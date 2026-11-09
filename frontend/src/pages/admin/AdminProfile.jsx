import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserCircle, ShieldCheck, Bell, SlidersHorizontal, Activity, PlugZap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminProfile, fetchMe } from '../../services/adminApi';
import { Loading, ErrorState } from '../../components/StateViews.jsx';
import ProfileGeneral from './profile/ProfileGeneral.jsx';
import ProfileSecurity from './profile/ProfileSecurity.jsx';
import ProfileNotifications from './profile/ProfileNotifications.jsx';
import ProfileSettings from './profile/ProfileSettings.jsx';
import ProfileActivity from './profile/ProfileActivity.jsx';
import ProfileIntegrations from './profile/ProfileIntegrations.jsx';
import { tr } from '../../i18n/tr.js';

// Shaxsiy kabinet: har kim faqat o'z ma'lumotini ko'radi va o'zgartiradi.
// Yorliq havolada: ?tab=umumiy|xavfsizlik|bildirishnomalar|sozlamalar|faoliyat|integratsiyalar
const TABS = [
  { key: 'umumiy', label: tr('Umumiy'), icon: UserCircle },
  { key: 'xavfsizlik', label: tr('Xavfsizlik'), icon: ShieldCheck },
  { key: 'bildirishnomalar', label: tr('Bildirishnomalar'), icon: Bell },
  { key: 'sozlamalar', label: tr('Sozlamalar'), icon: SlidersHorizontal },
  { key: 'faoliyat', label: tr('Faoliyatim'), icon: Activity },
  { key: 'integratsiyalar', label: tr('Integratsiyalar'), icon: PlugZap },
];

export default function AdminProfile() {
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'umumiy';
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    adminProfile
      .get()
      .then(setProfile)
      .catch((err) => setError(err?.response?.data?.error || tr("Profilni yuklab bo'lmadi.")));
  }, []);
  useEffect(load, [load]);

  // Profil o'zgarganda sarlavha va menyu ham yangilanadi (/auth/me).
  const onChange = useCallback(
    (next) => {
      if (next) setProfile(next);
      fetchMe()
        .then(setUser)
        .catch(() => {});
    },
    [setUser]
  );

  const toast = useCallback((msg, type = 'info') => showToast(msg, type), [showToast]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-2xl font-bold text-ink">{tr('Mening profilim')}</h1>

      <div className="-mx-1 overflow-x-auto border-b border-border" role="tablist">
        <div className="flex min-w-max gap-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !profile ? (
        <Loading />
      ) : (
        <>
          {tab === 'umumiy' && <ProfileGeneral profile={profile} onChange={onChange} toast={toast} />}
          {tab === 'xavfsizlik' && <ProfileSecurity profile={profile} onChange={onChange} toast={toast} />}
          {tab === 'bildirishnomalar' && <ProfileNotifications profile={profile} onChange={onChange} toast={toast} />}
          {tab === 'sozlamalar' && <ProfileSettings profile={profile} onChange={onChange} toast={toast} />}
          {tab === 'faoliyat' && <ProfileActivity />}
          {tab === 'integratsiyalar' && <ProfileIntegrations toast={toast} />}
        </>
      )}
    </div>
  );
}
