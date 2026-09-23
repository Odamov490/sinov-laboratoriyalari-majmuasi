import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
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
  Package,
  ScanLine,
  ScrollText,
  Info,
  ClipboardList,
  Layers,
  Award,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from '../components/StateViews.jsx';
import { adminResource } from '../services/adminApi';
import AdminHeaderMenu from '../components/admin/AdminHeaderMenu.jsx';

const MENU = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER', 'EDITOR'] },
  { to: '/admin/arizalar', label: 'Arizalar', icon: Inbox, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/laboratoriyalar', label: 'Laboratoriyalar', icon: FlaskConical, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/xizmatlar', label: 'Xizmatlar', icon: Wrench, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/narxlar', label: 'Narxlar', icon: Tag, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/standartlar', label: 'Standartlar', icon: BookOpen, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/tnved-reglament', label: 'TN VED reglament', icon: ScrollText, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/korsatkichlar', label: "Ko'rsatkichlar hovuzi", icon: ClipboardList, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/sinov-dasturlari', label: 'Sinov dasturlari', icon: Layers, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/yangiliklar', label: 'Yangiliklar', icon: Newspaper, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/hujjatlar', label: 'Hujjatlar', icon: FileText, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/mutaxassislar', label: 'Mutaxassislar', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/uskunalar', label: 'Uskunalar', icon: Cpu, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/galereya', label: 'Galereya', icon: Image, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/faq', label: 'FAQ', icon: HelpCircle, roles: ['SUPER_ADMIN', 'EDITOR'] },
  { to: '/admin/akkreditatsiya', label: 'Akkreditatsiya', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/deklaratsiya-sertifikat', label: 'Deklaratsiya/sertifikat', icon: Info, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/murojaatlar', label: 'Murojaatlar', icon: Mail, roles: ['SUPER_ADMIN', 'MANAGER'], badgeKey: 'unreadMessages' },
  { to: '/admin/namunalar', label: 'Namunalar', icon: Package, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/skanerlash', label: 'Skanerlash', icon: ScanLine, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users, roles: ['SUPER_ADMIN'] },
  { to: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings, roles: ['SUPER_ADMIN'] },
];

// SMK (Sifat Menejmenti Kompleksi, ISO/IEC 17025) — 20 quyi-modul, fazalar
// bo'yicha guruhlangan. Sidebar'da 2 bosqichli accordion: "SMK" bosilsa
// fazalar ro'yxati ochiladi, faza bosilsa o'sha fazaning modullari o'sha
// ustunda pastga qarab chiqadi (bir vaqtda faqat bitta faza ochiq turadi),
// modulga bosilganda o'zining alohida sahifasiga o'tiladi.
const SMK_PHASES = [
  {
    phase: '1-faza — Muammo boshqaruvi',
    items: [
      { to: '/admin/smk/nomuvofiqliklar', label: 'Nomuvofiqliklar (CAPA)', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/shikoyatlar', label: 'Sifat shikoyatlari', roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    phase: '2-faza — Hujjat boshqaruvi',
    items: [
      { to: '/admin/smk/hujjatlar', label: 'SMK Hujjatlar', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/hujjat-versiyalari', label: 'Hujjat versiyalari', roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    phase: '3-faza — Auditlar',
    items: [
      { to: '/admin/smk/auditlar', label: 'Ichki auditlar', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/audit-topilmalari', label: 'Audit topilmalari', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    phase: '4-faza — Texnik yadro',
    items: [
      { to: '/admin/smk/kalibrlash', label: 'Uskunalar kalibrlash', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/treninglar', label: 'Xodimlar treningi', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/qc', label: 'Ichki sifat nazorati', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/malakaviy-sinovlar', label: 'Malakaviy sinovlar', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/olchov-noaniqligi', label: "O'lchov noaniqligi", roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/metodika', label: 'Metodikani tasdiqlash', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    phase: '5-faza — Tashkiliy',
    items: [
      { to: '/admin/smk/xolislik', label: 'Xolislik deklaratsiyasi', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/taminotchilar', label: "Ta'minotchilarni baholash", roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/subpudratchilar', label: 'Subpudratchilar', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/muhit-monitoring', label: 'Muhit sharoitlari', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/tanishtirish', label: 'Hujjat bilan tanishtirish', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    phase: '6-faza — Strategik',
    items: [
      { to: '/admin/smk/boshqaruv-sharhi', label: 'Boshqaruv sharhi', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/risklar', label: 'Risklar reestri', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/maqsadlar', label: 'Sifat maqsadlari (KPI)', roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/takliflar', label: 'Yaxshilash takliflari', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/arxiv-siyosati', label: 'Arxiv/saqlash siyosati', roles: ['SUPER_ADMIN'] },
    ],
  },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [smkOpen, setSmkOpen] = useState(false);
  const [openPhase, setOpenPhase] = useState(null);

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

  // Auto-expand SMK + the relevant phase when navigating straight to a
  // module URL (bookmark, page reload, back button), so the sidebar always
  // reflects where you actually are.
  useEffect(() => {
    if (!location.pathname.startsWith('/admin/smk')) return;
    setSmkOpen(true);
    const phase = SMK_PHASES.find((p) => p.items.some((i) => location.pathname.startsWith(i.to)));
    if (phase) setOpenPhase(phase.phase);
  }, [location.pathname]);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const badgeValues = { unreadMessages };
  const items = MENU.filter((m) => m.roles.includes(user.role));
  const visiblePhases = SMK_PHASES.map((p) => ({
    ...p,
    items: p.items.filter((i) => i.roles.includes(user.role)),
  })).filter((p) => p.items.length > 0);

  const renderLink = (item) => {
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
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </NavLink>
    );
  };

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
          {items.map((item) => renderLink(item))}

          {visiblePhases.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSmkOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Award className="h-4 w-4" /> SMK
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${smkOpen ? 'rotate-180' : ''}`} />
              </button>

              {smkOpen &&
                visiblePhases.map((p) => {
                  const phaseOpen = openPhase === p.phase;
                  return (
                    <div key={p.phase}>
                      <button
                        type="button"
                        onClick={() => setOpenPhase((cur) => (cur === p.phase ? null : p.phase))}
                        className="flex w-full items-center justify-between rounded-lg py-2 pl-8 pr-3 text-xs font-semibold uppercase tracking-wide text-white/50 hover:bg-white/10 hover:text-white/80"
                      >
                        <span>{p.phase}</span>
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${phaseOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {phaseOpen &&
                        p.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              `block rounded-lg py-2 pl-12 pr-3 text-sm font-medium transition-colors ${
                                isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }`
                            }
                            onClick={() => setOpen(false)}
                          >
                            {item.label}
                          </NavLink>
                        ))}
                    </div>
                  );
                })}
            </div>
          )}

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
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-5">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6 text-primary" />
          </button>
          <div className="ml-auto">
            <AdminHeaderMenu />
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}