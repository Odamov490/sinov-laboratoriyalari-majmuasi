import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Wrench,
  Tag,
  BookOpen,
  Newspaper,
  FileText,
  Users,
  Cpu,
  Image,
  HelpCircle,
  Inbox,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from '../components/StateViews.jsx';
import { adminResource } from '../services/adminApi';

const MENU = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER', 'EDITOR'] },
  { to: '/admin/arizalar', label: 'Arizalar', icon: Inbox, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/laboratoriyalar', label: 'Laboratoriyalar', icon: FlaskConical, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/xizmatlar', label: 'Xizmatlar', icon: Wrench, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/narxlar', label: 'Narxlar', icon: Tag, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/standartlar', label: 'Standartlar', icon: BookOpen, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/yangiliklar', label: 'Yangiliklar', icon: Newspaper, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/hujjatlar', label: 'Hujjatlar', icon: FileText, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/mutaxassislar', label: 'Mutaxassislar', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/uskunalar', label: 'Uskunalar', icon: Cpu, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/galereya', label: 'Galereya', icon: Image, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/faq', label: 'FAQ', icon: HelpCircle, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/akkreditatsiya', label: 'Akkreditatsiya', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/murojaatlar', label: 'Murojaatlar', icon: Mail, roles: ['SUPER_ADMIN', 'MANAGER'], badgeKey: 'unreadMessages' },
  { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users, roles: ['SUPER_ADMIN'] },
  { to: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings, roles: ['SUPER_ADMIN'] },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'MANAGER'].includes(user.role)) return;

    const loadUnread = () => {
      adminResource('contact-messages')
        .list({ pageSize: 100 })
        .then((d) => {
          const count = (d.items || []).filter((m) => !m.isRead).length;
          setUnreadMessages(count);
        })
        .catch(() => {});
    };

    loadUnread();
    const interval = setInterval(loadUnread, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const badgeValues = { unreadMessages };
  const items = MENU.filter((m) => m.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-bg-light flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <span className="font-bold">SLM Admin</span>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {items.map((item) => {
            const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                             {badgeCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white mt-4"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-5 lg:justify-end">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6 text-primary" />
          </button>
          <div className="text-sm text-slate-600">
            <span className="font-medium text-ink">{user.fullName}</span>
            <span className="ml-2 text-xs rounded-full bg-bg-light px-2 py-1 text-slate-500">{user.role}</span>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}