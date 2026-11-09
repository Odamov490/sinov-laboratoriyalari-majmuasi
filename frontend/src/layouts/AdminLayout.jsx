import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
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
  BarChart3,
  ListChecks,
  UserCircle,
  MessageCircle,
  Star,
  PlugZap,
} from 'lucide-react';
import { setNotifyPrefs } from '../utils/notifyPrefs';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from '../components/StateViews.jsx';
import { adminResource, adminTasks } from '../services/adminApi';
import ChangePasswordForm from '../components/admin/ChangePasswordForm.jsx';
import AdminHeaderMenu from '../components/admin/AdminHeaderMenu.jsx';
import AdminMenuGroup from '../components/admin/AdminMenuGroup.jsx';
import Logo from '../components/Logo.jsx';
import { smkConfinedLabId } from '../pages/admin/AdminSmkPage.jsx';
import { tr, currentLang, LOADED_LANG } from '../i18n/tr.js';

// Always shown at the very top, outside any collapsible group.
const ALL_ROLES = ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'];
const DASHBOARD_ITEM = { to: '/admin/dashboard', label: tr('Dashboard'), icon: LayoutDashboard, roles: ALL_ROLES };
// Personal items, shown under Dashboard for every role (the only menu of a STAFF user).
const PERSONAL_ITEMS = [
  { to: '/admin/vazifalar', label: tr('Vazifalar'), icon: ListChecks, roles: ALL_ROLES, badgeKey: 'myTasks' },
  { to: '/admin/chat', label: tr('Chat'), icon: MessageCircle, roles: ALL_ROLES, badgeKey: 'chat' },
  { to: '/admin/mening-profilim', label: tr('Mening profilim'), icon: UserCircle, roles: ALL_ROLES },
];
// A STAFF user may open only these; any other /admin address goes to the dashboard.
const STAFF_PATHS = ['/admin/dashboard', '/admin/vazifalar', '/admin/chat', '/admin/mening-profilim'];

// SMK (Sifat Menejmenti Kompleksi, ISO/IEC 17025) modules. Each laboratory
// keeps its own SMK, so these are rendered inside the Sifat group once per
// lab, with `to` rewritten to /admin/smk/<lab-slug>/<module>. New SMK modules
// go here.
const SMK_MODULES = [
      { to: '/admin/smk/nomuvofiqliklar', label: tr('Nomuvofiqliklar (CAPA)'), icon: AlertTriangle, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/shikoyatlar', label: tr('Sifat shikoyatlari'), icon: MessageSquare, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/hujjatlar', label: tr('SMK Hujjatlar'), icon: FileCheck, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/hujjat-versiyalari', label: tr('Hujjat versiyalari'), icon: History, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/auditlar', label: tr('Ichki auditlar'), icon: ClipboardCheck, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/audit-topilmalari', label: tr('Audit topilmalari'), icon: Search, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/kalibrlash', label: tr('Uskunalar kalibrlash'), icon: Gauge, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/treninglar', label: tr('Xodimlar treningi'), icon: GraduationCap, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/qc', label: tr('Ichki sifat nazorati'), icon: CheckSquare, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/malakaviy-sinovlar', label: tr('Malakaviy sinovlar'), icon: Target, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/olchov-noaniqligi', label: tr("O'lchov noaniqligi"), icon: Calculator, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/metodika', label: tr('Metodikani tasdiqlash'), icon: FileSearch, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/xolislik', label: tr('Xolislik deklaratsiyasi'), icon: Scale, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/taminotchilar', label: tr("Ta'minotchilarni baholash"), icon: Truck, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/subpudratchilar', label: tr('Subpudratchilar'), icon: Handshake, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/muhit-monitoring', label: tr('Muhit sharoitlari'), icon: Thermometer, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/tanishtirish', label: tr('Hujjat bilan tanishtirish'), icon: UserCheck, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/boshqaruv-sharhi', label: tr('Boshqaruv sharhi'), icon: Presentation, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/risklar', label: tr('Risklar reestri'), icon: AlertOctagon, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/maqsadlar', label: tr('Sifat maqsadlari (KPI)'), icon: Flag, roles: ['SUPER_ADMIN'] },
      { to: '/admin/smk/takliflar', label: tr('Yaxshilash takliflari'), icon: Lightbulb, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/smk/arxiv-siyosati', label: tr('Arxiv/saqlash siyosati'), icon: Archive, roles: ['SUPER_ADMIN'] },
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
    label: tr('Operatsiyalar'),
    icon: Briefcase,
    items: [
      { to: '/admin/arizalar', label: tr('Arizalar'), icon: Inbox, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/namunalar', label: tr('Namunalar'), icon: Package, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/hisobot', label: tr('Hisobot'), icon: BarChart3, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/skanerlash', label: tr('Skanerlash'), icon: ScanLine, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/murojaatlar', label: tr('Murojaatlar'), icon: Mail, roles: ['SUPER_ADMIN', 'MANAGER'], badgeKey: 'unreadMessages' },
    ],
  },
  {
    key: 'katalog',
    label: tr('Katalog'),
    icon: Library,
    items: [
      { to: '/admin/laboratoriyalar', label: tr('Laboratoriyalar'), icon: FlaskConical, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/xizmatlar', label: tr('Xizmatlar'), icon: Wrench, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/narxlar', label: tr('Narxlar'), icon: Tag, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/standartlar', label: tr('Standartlar'), icon: BookOpen, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/mutaxassislar', label: tr('Mutaxassislar'), icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/uskunalar', label: tr('Uskunalar'), icon: Cpu, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/tnved-reglament', label: tr('TN VED reglament'), icon: ScrollText, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/korsatkichlar', label: tr("Ko'rsatkichlar hovuzi"), icon: ClipboardList, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/sinov-dasturlari', label: tr('Sinov dasturlari'), icon: Layers, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    key: 'kontent',
    label: tr('Kontent'),
    icon: PenLine,
    items: [
      { to: '/admin/yangiliklar', label: tr('Yangiliklar'), icon: Newspaper, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/hujjatlar', label: tr('Hujjatlar'), icon: FileText, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/galereya', label: tr('Galereya'), icon: Image, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/faq', label: 'FAQ', icon: HelpCircle, roles: ['SUPER_ADMIN', 'EDITOR'] },
      { to: '/admin/deklaratsiya-sertifikat', label: tr('Deklaratsiya/sertifikat'), icon: Info, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    // Akkreditatsiya + per-laboratory SMK subgroups (see SMK_MODULES).
    key: 'sifat',
    label: tr('Sifat'),
    icon: Award,
    smk: true,
    items: [
      { to: '/admin/akkreditatsiya', label: tr('Akkreditatsiya'), icon: ShieldCheck, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    key: 'tizim',
    label: tr('Tizim'),
    icon: Settings,
    items: [
      { to: '/admin/foydalanuvchilar', label: tr('Foydalanuvchilar'), icon: Users, roles: ['SUPER_ADMIN'] },
      { to: '/admin/sozlamalar', label: tr('Sozlamalar'), icon: Settings, roles: ['SUPER_ADMIN'] },
      { to: '/admin/tris-ulanishlar', label: tr('Tris ulanishlari'), icon: PlugZap, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    key: 'boshqa',
    label: tr('Boshqa'),
    icon: MoreHorizontal,
    items: [],
  },
];

// Menyu kaliti = /admin/<kalit> (backend utils/menuCatalog.js bilan bir xil).
const menuKey = (item) => item.to.replace('/admin/', '');
const ALL_MENU_ITEMS = [DASHBOARD_ITEM, ...PERSONAL_ITEMS, ...MENU_GROUPS.flatMap((g) => g.items)];
// Shu rolga ochiq bandlar: { key, to, label, icon } (Dashboard'dagi tezkor havolalar uchun ham).
export function menuItemsForRole(role) {
  return ALL_MENU_ITEMS.filter((i) => i.roles.includes(role)).map((i) => ({ ...i, key: menuKey(i) }));
}
export function landingPathFor(user) {
  const key = user?.preferences?.landingPage;
  const item = key && menuItemsForRole(user.role).find((i) => i.key === key);
  return item ? item.to : '/admin/dashboard';
}

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
  // Menyu/ustun nomlari modul yuklanganda tarjima qilingan; til boshqa joyda
  // (ommaviy saytda) almashtirilgan bo'lsa, ular yangi tilda qayta hisoblansin.
  useEffect(() => {
    if (currentLang() !== LOADED_LANG) window.location.reload();
  }, []);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [myTasks, setMyTasks] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  // Bildirishnoma sozlamalari (ovoz, brauzer, tinch soatlar) klientda qo'llanadi.
  useEffect(() => {
    setNotifyPrefs(user?.preferences);
  }, [user]);
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

  // My open tasks badge (every role, once a minute; not while a temporary
  // password still has to be changed — the API refuses then).
  useEffect(() => {
    if (!user || user.mustChangePassword) return undefined;
    const loadTasks = () =>
      adminTasks
        .mySummary()
        .then((d) => setMyTasks(d.openCount || 0))
        .catch(() => {});
    loadTasks();
    const interval = setInterval(loadTasks, 60000);
    window.addEventListener('tasks:changed', loadTasks);
    return () => {
      clearInterval(interval);
      window.removeEventListener('tasks:changed', loadTasks);
    };
  }, [user]);

  // Chat: socket ulanishi va o'qilmaganlar badge'i. Modul dinamik yuklanadi
  // (socket.io-client asosiy bundle'ga tushmaydi).
  useEffect(() => {
    if (!user || user.mustChangePassword) return undefined;
    let offs = [];
    let alive = true;
    import('../chat/chatStore').then((chat) => {
      if (!alive) return;
      chat.start(user);
      chat.loadOutbox();
      chat.refreshUnread();
      offs = [
        chat.on('unread', (u) => setChatUnread(u.total || 0)),
        chat.on('status', (s) => s === 'disabled' && setChatUnread(0)),
      ];
    });
    return () => {
      alive = false;
      offs.forEach((off) => off());
    };
  }, [user]);

  // Chiqishda socket yopiladi.
  useEffect(() => {
    if (user) return;
    import('../chat/chatStore').then((chat) => chat.stop()).catch(() => {});
  }, [user]);

  // Brauzer sarlavhasi: "(3) SLM ..." — o'qilmagan chat xabarlari.
  useEffect(() => {
    const strip = (t) => t.replace(/^\(\d+\+?\)\s*/, '');
    const apply = () => {
      const base = strip(document.title);
      const next = chatUnread > 0 ? `(${chatUnread > 99 ? '99+' : chatUnread}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const titleEl = document.querySelector('title');
    const obs = titleEl ? new MutationObserver(apply) : null;
    obs?.observe(titleEl, { childList: true });
    return () => {
      obs?.disconnect();
      document.title = strip(document.title);
    };
  }, [chatUnread, location.pathname]);

  if (loading) return <Loading />;
  // Kirgandan keyin shu sahifaga qaytish (masalan, QR havola: /admin/skanerlash?code=...).
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;

  // Temporary password: nothing but the change form until it is replaced
  // (the API answers 403 to everything else meanwhile).
  if (user.mustChangePassword) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
        <div className="w-full max-w-md card p-8">
          <Logo className="mb-5" />
          <h1 className="text-lg font-bold text-ink">{tr('Parolni almashtiring')}</h1>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            {tr("Siz vaqtinchalik parol bilan kirdingiz. Davom etish uchun o'zingizning yangi parolingizni o'rnating.")}
          </p>
          <ChangePasswordForm submitLabel={tr('Parolni saqlash va davom etish')} />
          <button onClick={logout} className="mt-4 w-full text-sm text-slate-500 hover:text-ink">
            {tr('Chiqish')}
          </button>
        </div>
      </div>
    );
  }

  // "/admin" asosiy manzili: tanlangan boshlang'ich sahifa (ruxsati tekshiriladi).
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to={landingPathFor(user)} replace />;
  }

  if (user.role === 'STAFF' && !STAFF_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const badgeValues = { unreadMessages, myTasks, chat: chatUnread };
  const roleItems = menuItemsForRole(user.role);
  const favorites = (user.preferences?.favorites || []).map((k) => roleItems.find((i) => i.key === k)).filter(Boolean);
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
    <div className={`min-h-screen bg-bg-light flex ${user.preferences?.density === 'compact' ? 'density-compact' : ''}`}>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Logo variant="dark" />
            <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/60">Admin</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="admin-sidebar-nav p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {favorites.length > 0 && (
            <div className="mb-2 border-b border-white/10 pb-2">
              <p className="flex items-center gap-1.5 px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                <Star className="h-3 w-3" /> {tr('Sevimlilar')}
              </p>
              {favorites.map((item) => renderLink(item))}
            </div>
          )}
          {canSee(DASHBOARD_ITEM) && renderLink(DASHBOARD_ITEM)}
          {PERSONAL_ITEMS.filter(canSee).map((item) => renderLink(item))}
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
            {tr('Chiqish')}
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
