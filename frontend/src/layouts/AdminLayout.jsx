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
  AlertTriangle,
  MessageSquare,
  FileCheck,
  History,
  ClipboardCheck,
  Search,
  Gauge,
  GraduationCap,
  CheckSquare,
  Target,
  Calculator,
  FileSearch,
  Scale,
  Truck,
  Handshake,
  Thermometer,
  UserCheck,
  Presentation,
  AlertOctagon,
  Flag,
  Lightbulb,
  Archive,
  Briefcase,
  Library,
  PenLine,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from '../components/StateViews.jsx';
import { adminResource } from '../services/adminApi';
import AdminHeaderMenu from '../components/admin/AdminHeaderMenu.jsx';
import AdminMenuGroup from '../components/admin/AdminMenuGroup.jsx';
import { smkConfinedLabId } from '../pages/admin/AdminSmkPage.jsx';

// Always shown at the very top, outside any collapsible group.
const DASHBOARD_ITEM = { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER', 'EDITOR'] };

// SMK (Sifat Menejmenti Kompleksi, ISO/IEC 17025) modules. Each laboratory
// keeps its own SMK, so these are rendered inside the Sifat group once per
// lab, with `to` rewritten to /admin/smk/<lab-slug>/<module>. New SMK modules
// go here.
const SMK_MODULES = [
      { to: '/admin/smk/nomuvofiqliklar', label: 'Nomuvofiqliklar (CAPA)', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/shikoyatlar', label: 'Sifat shikoyatlari', icon: MessageSquare, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/hujjatlar', label: 'SMK Hujjatlar', icon: FileCheck, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/hujjat-versiyalari', label: 'Hujjat versiyalari', icon: History, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/auditlar', label: 'Ichki auditlar', icon: ClipboardCheck, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/audit-topilmalari', label: 'Audit topilmalari', icon: Search, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/kalibrlash', label: 'Uskunalar kalibrlash', icon: Gauge, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/treninglar', label: 'Xodimlar treningi', icon: GraduationCap, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/qc', label: 'Ichki sifat nazorati', icon: CheckSquare, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/malakaviy-sinovlar', label: 'Malakaviy sinovlar', icon: Target, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/olchov-noaniqligi', label: "O'lchov noaniqligi", icon: Calculator, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/metodika', label: 'Metodikani tasdiqlash', icon: FileSearch, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/xolislik', label: 'Xolislik deklaratsiyasi', icon: Scale, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/taminotchilar', label: "Ta'minotchilarni baholash", icon: Truck, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/subpudratchilar', label: 'Subpudratchilar', icon: Handshake, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/muhit-monitoring', label: 'Muhit sharoitlari', icon: Thermometer, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/tanishtirish', label: 'Hujjat bilan tanishtirish', icon: UserCheck, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/boshqaruv-sharhi', label: 'Boshqaruv sharhi', icon: Presentation, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/risklar', label: 'Risklar reestri', icon: AlertOctagon, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/maqsadlar', label: 'Sifat maqsadlari (KPI)', icon: Flag, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/takliflar', label: 'Yaxshilash takliflari', icon: Lightbulb, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/arxiv-siyosati', label: 'Arxiv/saqlash siyosati', icon: Archive, roles: ['SUPER_ADMIN'] },
];

const SMK_PREFIX = '/admin/smk/';
const smkGroupKey = (labSlug) => `smk:${labSlug}`;
const smkItemsForLab = (labSlug, items) =>
  items.map((item) => ({ ...item, to: item.to.replace(SMK_PREFIX, `${SMK_PREFIX}${labSlug}/`) }));

// Sidebar groups. Each item keeps its own to/label/icon/roles/badgeKey; a
// group whose items are all hidden for the current role is not rendered.
// New modules go into the fitting group's items (SMK modules -> 'sifat');
// anything that fits nowhere goes into 'boshqa' so it never drops out of the
// menu.
const MENU_GROUPS = [
  {
    key: 'operatsiyalar',
    label: 'Operatsiyalar',
    icon: Briefcase,
    items: [
      { to: '/admin/arizalar', label: 'Arizalar', icon: Inbox, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/namunalar', label: 'Namunalar', icon: Package, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/skanerlash', label: 'Skanerlash', icon: ScanLine, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/murojaatlar', label: 'Murojaatlar', icon: Mail, roles: ['SUPER_ADMIN', 'MANAGER'], badgeKey: 'unreadMessages' },
    ],
  },
  {
    key: 'katalog',
    label: 'Katalog',
    icon: Library,
    items: [
      { to: '/admin/laboratoriyalar', label: 'Laboratoriyalar', icon: FlaskConical, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/xizmatlar', label: 'Xizmatlar', icon: Wrench, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/narxlar', label: 'Narxlar', icon: Tag, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/standartlar', label: 'Standartlar', icon: BookOpen, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/mutaxassislar', label: 'Mutaxassislar', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/uskunalar', label: 'Uskunalar', icon: Cpu, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/tnved-reglament', label: 'TN VED reglament', icon: ScrollText, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/korsatkichlar', label: "Ko'rsatkichlar hovuzi", icon: ClipboardList, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/sinov-dasturlari', label: 'Sinov dasturlari', icon: Layers, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    key: 'kontent',
    label: 'Kontent',
    icon: PenLine,
    items: [
      { to: '/admin/yangiliklar', label: 'Yangiliklar', icon: Newspaper, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/hujjatlar', label: 'Hujjatlar', icon: FileText, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/galereya', label: 'Galereya', icon: Image, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/faq', label: 'FAQ', icon: HelpCircle, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/deklaratsiya-sertifikat', label: 'Deklaratsiya/sertifikat', icon: Info, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    // Akkreditatsiya + per-laboratory SMK subgroups (see SMK_MODULES).
    key: 'sifat',
    label: 'Sifat',
    icon: Award,
    smk: true,
    items: [
      { to: '/admin/akkreditatsiya', label: 'Akkreditatsiya', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    key: 'tizim',
    label: 'Tizim',
    icon: Settings,
    items: [
      { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users, roles: ['SUPER_ADMIN'] },
      { to: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    key: 'boshqa',
    label: 'Boshqa',
    icon: MoreHorizontal,
    items: [],
  },
];

const MENU_STORAGE_KEY = 'admin_menu_groups';
const DEFAULT_OPEN_GROUP = 'operatsiyalar';

const isItemActive = (item, pathname) => pathname === item.to || pathname.startsWith(`${item.to}/`);

// Keys of the groups that hold the current page: a top-level group, plus the
// lab subgroup for SMK pages (/admin/smk/<lab-slug>/...).
function findActiveGroupKeys(pathname) {
  if (pathname.startsWith(SMK_PREFIX)) {
    const labSlug = pathname.slice(SMK_PREFIX.length).split('/')[0];
    return labSlug ? ['sifat', smkGroupKey(labSlug)] : ['sifat'];
  }
  const group = MENU_GROUPS.find((g) => g.items.some((item) => isItemActive(item, pathname)));
  return group ? [group.key] : [];
}

const withOpen = (state, keys) => (keys.every((k) => state[k]) ? state : { ...state, ...Object.fromEntries(keys.map((k) => [k, true])) });

function loadOpenGroups(pathname) {
  try {
    const saved = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY));
    if (saved && typeof saved === 'object') return saved;
  } catch {
    // unreadable/blocked storage -> fall through to defaults
  }
  return withOpen({ [DEFAULT_OPEN_GROUP]: true }, findActiveGroupKeys(pathname));
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [openGroups, setOpenGroups] = useState(() => loadOpenGroups(location.pathname));

  // The group holding the current page is always expanded on navigation.
  useEffect(() => {
    setOpenGroups((prev) => withOpen(prev, findActiveGroupKeys(location.pathname)));
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      // storage unavailable — state just won't persist
    }
  }, [openGroups]);

  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Laboratories for the per-lab SMK subgroups (only roles that see SMK).
  const [labs, setLabs] = useState([]);
  useEffect(() => {
    if (!user || !SMK_MODULES.some((m) => m.roles.includes(user.role))) return;
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items || []))
      .catch(() => setLabs([]));
  }, [user]);

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
  const canSee = (item) => item.roles.includes(user.role);
  // A lab-bound user only gets their own lab's SMK.
  const smkModules = SMK_MODULES.filter(canSee);
  const confinedLabId = smkConfinedLabId(user);
  const smkLabs = !smkModules.length
    ? []
    : confinedLabId
      ? labs.filter((l) => l.id === confinedLabId)
      : labs;
  const groups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(canSee),
    labGroups: group.smk
      ? smkLabs.map((lab) => ({
          key: smkGroupKey(lab.slug),
          label: lab.nameUz,
          icon: FlaskConical,
          items: smkItemsForLab(lab.slug, smkModules),
        }))
      : [],
  })).filter((group) => group.items.length > 0 || group.labGroups.length > 0);

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
        <nav className="admin-sidebar-nav p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {canSee(DASHBOARD_ITEM) && renderLink(DASHBOARD_ITEM)}
          {groups.map((group) => (
            <AdminMenuGroup
              key={group.key}
              group={group}
              isOpen={Boolean(openGroups[group.key])}
              onToggle={() => toggleGroup(group.key)}
              badgeCount={group.items.reduce((sum, item) => sum + (item.badgeKey ? badgeValues[item.badgeKey] || 0 : 0), 0)}
            >
              {group.items.map((item) => renderLink(item))}
              {group.labGroups.map((lab) => (
                <AdminMenuGroup
                  key={lab.key}
                  group={lab}
                  nested
                  isOpen={Boolean(openGroups[lab.key])}
                  onToggle={() => toggleGroup(lab.key)}
                >
                  {lab.items.map((item) => renderLink(item))}
                </AdminMenuGroup>
              ))}
            </AdminMenuGroup>
          ))}
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
