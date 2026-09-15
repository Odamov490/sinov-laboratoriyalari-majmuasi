import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAdminNotifications } from '../../services/adminApi';

const NOTIF_TARGET = { message: '/admin/murojaatlar', application: '/admin/arizalar' };

function formatDateTime(d) {
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminHeaderMenu() {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState({ items: [], total: 0 });

  const canSeeNotifications = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!canSeeNotifications) return undefined;
    const load = () => getAdminNotifications().then(setNotifications).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [canSeeNotifications]);

  return (
    <div className="flex items-center gap-3">
      <span className="hidden md:inline text-xs text-slate-400">{formatDateTime(now)}</span>

      {canSeeNotifications && (
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-bg-light hover:text-primary transition-colors"
            aria-label="Bildirishnomalar"
          >
            <Bell className="h-5 w-5" />
            {notifications.total > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifications.total > 99 ? '99+' : notifications.total}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-white shadow-card py-2 z-20">
                <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Bildirishnomalar
                </p>
                {notifications.items.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">Yangi bildirishnoma yo'q.</p>
                ) : (
                  notifications.items.map((n) => (
                    <Link
                      key={`${n.type}-${n.id}`}
                      to={NOTIF_TARGET[n.type] || '/admin/dashboard'}
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-2 text-sm text-ink hover:bg-bg-light"
                    >
                      {n.text}
                    </Link>
                  ))
                )}
                <Link
                  to="/admin/murojaatlar"
                  onClick={() => setNotifOpen(false)}
                  className="block px-4 py-2 text-xs font-semibold text-primary hover:bg-bg-light border-t border-border mt-1"
                >
                  Barchasini ko'rish
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => {
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        >
          <span className="font-medium text-ink">{user.fullName}</span>
          <span className="text-xs rounded-full bg-bg-light px-2 py-1 text-slate-500">{user.role}</span>
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
