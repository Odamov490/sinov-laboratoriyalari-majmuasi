import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, LogOut, CheckCheck, ShieldCheck, BellRing } from 'lucide-react';
import Avatar from '../Avatar.jsx';
import { alertFor, TYPE_TO_EVENT } from '../../utils/notifyPrefs';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminNotifications, getInboxSummary } from '../../services/adminApi';
import { roleLabel } from '../../utils/roles';
import { tr, trServer, dateLocale } from '../../i18n/tr.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const INBOX_TARGET = { message: '/admin/murojaatlar', application: '/admin/arizalar' };
const POLL_MS = 60000;

function formatDateTime(d) {
  return d.toLocaleString(dateLocale(), { dateStyle: 'medium', timeStyle: 'short' });
}

const timeAgo = (value) => {
  const min = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (min < 1) return tr('hozir');
  if (min < 60) return tr('{0} daqiqa oldin', min);
  const h = Math.round(min / 60);
  if (h < 24) return tr('{0} soat oldin', h);
  return new Date(value).toLocaleDateString(dateLocale());
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

  // Yangi kelgan bildirishnomalar uchun ovoz/brauzer xabari (sozlamaga qarab).
  const seen = useRef(null);
  const loadPersonal = () =>
    adminNotifications
      .list()
      .then((data) => {
        const fresh = seen.current ? data.items.filter((n) => !n.readAt && !seen.current.has(n.id)) : [];
        seen.current = new Set(data.items.map((n) => n.id));
        fresh.forEach((n) => alertFor(TYPE_TO_EVENT[n.type] || 'task_status', { title: 'SLM', body: trServer(n.title), tag: n.id, onClick: () => n.linkUrl && navigate(n.linkUrl) }));
        setPersonal(data);
      })
      .catch(() => {});

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
      <LanguageSwitcher />

      <div className="relative">
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-bg-light hover:text-primary transition-colors"
          aria-label={tr('Bildirishnomalar{0}', badge ? tr(": {0} ta o'qilmagan", badge) : '')}
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{tr('Bildirishnomalar')}</p>
                {personal.unreadCount > 0 && (
                  <button onClick={readAll} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <CheckCheck className="h-3.5 w-3.5" /> {tr("Hammasini o'qildi qilish")}
                  </button>
                )}
              </div>
              {personal.items.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">{tr("Bildirishnoma yo'q.")}</p>
              ) : (
                personal.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-bg-light ${n.readAt ? 'text-slate-500' : 'text-ink font-medium bg-primary/5'}`}
                  >
                    {trServer(n.title)}
                    <span className="block text-xs font-normal text-slate-400">{timeAgo(n.createdAt)}</span>
                  </button>
                ))
              )}

              {seesInbox && (
                <>
                  <p className="mt-1 border-t border-border px-4 pt-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {tr('Murojaat va arizalar')}
                  </p>
                  {inbox.items.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-slate-400">{tr("Yangi murojaat yoki ariza yo'q.")}</p>
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

      <ProfileMenu
        user={user}
        logout={logout}
        open={profileOpen}
        setOpen={(v) => {
          setProfileOpen(v);
          if (v) setNotifOpen(false);
        }}
      />
    </div>
  );
}

const PROFILE_LINKS = [
  { to: '/admin/mening-profilim?tab=umumiy', label: tr('Mening profilim'), icon: User },
  { to: '/admin/mening-profilim?tab=xavfsizlik', label: tr('Xavfsizlik'), icon: ShieldCheck },
  { to: '/admin/mening-profilim?tab=bildirishnomalar', label: tr('Bildirishnoma sozlamalari'), icon: BellRing },
];

// Avatar menyusi: Esc va tashqariga bosish bilan yopiladi, strelkalar bilan boshqariladi.
function ProfileMenu({ user, logout, open, setOpen }) {
  const navigate = useNavigate();
  const wrap = useRef(null);
  const button = useRef(null);
  const items = useRef([]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    setTimeout(() => items.current[0]?.focus(), 0);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKeyDown = (e) => {
    const list = items.current.filter(Boolean);
    const i = list.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      setOpen(false);
      button.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      list[list.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="relative" ref={wrap} onKeyDown={onKeyDown}>
      <button
        ref={button}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-bg-light focus-ring"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} seed={user.id} size="sm" />
        <span className="hidden max-w-[180px] truncate font-medium text-ink sm:inline">{user.fullName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-white shadow-card">
          <div className="flex items-center gap-3 border-b border-border bg-bg-light px-4 py-3">
            <Avatar name={user.fullName} src={user.avatarUrl} seed={user.id} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
              <p className="truncate text-xs text-slate-500">{[roleLabel(user.role), user.labName].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <div className="py-1">
            {PROFILE_LINKS.map((l, i) => (
              <button
                key={l.to}
                ref={(el) => (items.current[i] = el)}
                role="menuitem"
                onClick={() => go(l.to)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-bg-light focus:bg-bg-light focus:outline-none"
              >
                <l.icon className="h-4 w-4 text-slate-400" /> {l.label}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              ref={(el) => (items.current[PROFILE_LINKS.length] = el)}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
            >
              <LogOut className="h-4 w-4" /> {tr('Chiqish')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
