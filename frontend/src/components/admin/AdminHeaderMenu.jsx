import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, LogOut, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminNotifications, getInboxSummary } from '../../services/adminApi';
import { roleLabel } from '../../utils/roles';

const INBOX_TARGET = { message: '/admin/murojaatlar', application: '/admin/arizalar' };
const POLL_MS = 60000;

function formatDateTime(d) {
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
}

const timeAgo = (value) => {
  const min = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (min < 1) return 'hozir';
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} soat oldin`;
  return new Date(value).toLocaleDateString('uz-UZ');
};

export default function AdminHeaderMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [personal, setPersonal] = useState({ items: [], unreadCount: 0 });
  const [inbox, setInbox] = useState({ items: [], total: 0 });

  // Messages/applications summary is only for the roles that handle them;
  // no request at all is made for the others.
  const seesInbox = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const loadPersonal = () => adminNotifications.list().then(setPersonal).catch(() => {});

  useEffect(() => {
    loadPersonal();
    const interval = setInterval(loadPersonal, POLL_MS);
    window.addEventListener('notifications:changed', loadPersonal);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:changed', loadPersonal);
    };
  }, []);

  useEffect(() => {
    if (!seesInbox) return undefined;
    const load = () => getInboxSummary().then(setInbox).catch(() => {});
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [seesInbox]);

  const openNotification = async (n) => {
    setNotifOpen(false);
    if (!n.readAt) {
      await adminNotifications.read(n.id).catch(() => {});
      loadPersonal();
    }
    if (n.linkUrl) navigate(n.linkUrl);
  };

  const readAll = async () => {
    await adminNotifications.readAll().catch(() => {});
    loadPersonal();
  };

  const badge = personal.unreadCount + (seesInbox ? inbox.total : 0);

  return (
    <div className="flex items-center gap-3">
      <span className="hidden md:inline text-xs text-slate-400">{formatDateTime(now)}</span>

      <div className="relative">
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-bg-light hover:text-primary transition-colors"
          aria-label={`Bildirishnomalar${badge ? `: ${badge} ta o'qilmagan` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {badge > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-white shadow-card py-2 z-20">
              <div className="flex items-center justify-between px-4 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bildirishnomalar</p>
                {personal.unreadCount > 0 && (
                  <button onClick={readAll} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <CheckCheck className="h-3.5 w-3.5" /> Hammasini o'qildi qilish
                  </button>
                )}
              </div>
              {personal.items.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Bildirishnoma yo'q.</p>
              ) : (
                personal.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-bg-light ${n.readAt ? 'text-slate-500' : 'text-ink font-medium bg-primary/5'}`}
                  >
                    {n.title}
                    <span className="block text-xs font-normal text-slate-400">{timeAgo(n.createdAt)}</span>
                  </button>
                ))
              )}

              {seesInbox && (
                <>
                  <p className="mt-1 border-t border-border px-4 pt-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Murojaat va arizalar
                  </p>
                  {inbox.items.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-slate-400">Yangi murojaat yoki ariza yo'q.</p>
                  ) : (
                    inbox.items.map((n) => (
                      <Link
                        key={`${n.type}-${n.id}`}
                        to={INBOX_TARGET[n.type] || '/admin/dashboard'}
                        onClick={() => setNotifOpen(false)}
                        className="block px-4 py-2 text-sm text-ink hover:bg-bg-light"
                      >
                        {n.text}
                      </Link>
                    ))
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        >
          <span className="font-medium text-ink">{user.fullName}</span>
          <span className="text-xs rounded-full bg-bg-light px-2 py-1 text-slate-500">{roleLabel(user.role)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {profileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-white shadow-card py-1 z-20">
              <Link
                to="/admin/mening-profilim"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-bg-light"
              >
                <User className="h-4 w-4" /> Profilim
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-bg-light"
              >
                <LogOut className="h-4 w-4" /> Chiqish
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
