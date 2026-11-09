// Admin menyu bandlari (kalit = /admin/<kalit>) va ularga ruxsat etilgan
// rollar. Faqat "Kirgandan keyin ochiladigan sahifa" va "Sevimlilar"ni
// tekshirish uchun. Yon menyuning o'zi frontend/src/layouts/AdminLayout.jsx
// da — u yerga yangi band qo'shilsa, shu ro'yxatga ham qo'shing.
// Laboratoriya bo'yicha SMK sahifalari (dinamik manzil) bu yerda yo'q.
const ALL = ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'];
const SM = ['SUPER_ADMIN', 'MANAGER'];
const SE = ['SUPER_ADMIN', 'EDITOR'];
const S = ['SUPER_ADMIN'];

const MENU_CATALOG = [
  { key: 'dashboard', label: 'Dashboard', roles: ALL },
  { key: 'vazifalar', label: 'Vazifalar', roles: ALL },
  { key: 'chat', label: 'Chat', roles: ALL },
  { key: 'mening-profilim', label: 'Mening profilim', roles: ALL },
  { key: 'arizalar', label: 'Arizalar', roles: SM },
  { key: 'namunalar', label: 'Namunalar', roles: SM },
  { key: 'hisobot', label: 'Hisobot', roles: SM },
  { key: 'skanerlash', label: 'Skanerlash', roles: SM },
  { key: 'murojaatlar', label: 'Murojaatlar', roles: SM },
  { key: 'laboratoriyalar', label: 'Laboratoriyalar', roles: SM },
  { key: 'xizmatlar', label: 'Xizmatlar', roles: SM },
  { key: 'narxlar', label: 'Narxlar', roles: SM },
  { key: 'standartlar', label: 'Standartlar', roles: SM },
  { key: 'mutaxassislar', label: 'Mutaxassislar', roles: SM },
  { key: 'uskunalar', label: 'Uskunalar', roles: SM },
  { key: 'tnved-reglament', label: 'TN VED reglament', roles: SM },
  { key: 'korsatkichlar', label: "Ko'rsatkichlar hovuzi", roles: SM },
  { key: 'sinov-dasturlari', label: 'Sinov dasturlari', roles: SM },
  { key: 'yangiliklar', label: 'Yangiliklar', roles: SE },
  { key: 'hujjatlar', label: 'Hujjatlar', roles: SE },
  { key: 'galereya', label: 'Galereya', roles: SE },
  { key: 'faq', label: 'FAQ', roles: SE },
  { key: 'deklaratsiya-sertifikat', label: 'Deklaratsiya/sertifikat', roles: SM },
  { key: 'akkreditatsiya', label: 'Akkreditatsiya', roles: SM },
  { key: 'foydalanuvchilar', label: 'Foydalanuvchilar', roles: S },
  { key: 'sozlamalar', label: 'Sozlamalar', roles: S },
  { key: 'tris-ulanishlar', label: 'Tris ulanishlari', roles: S },
  { key: 'chat-sozlamalari', label: 'Chat sozlamalari', roles: S },
  { key: 'stikerlar', label: 'Stikerlar', roles: S },
];

const menuForRole = (role) => MENU_CATALOG.filter((m) => m.roles.includes(role)).map(({ key, label }) => ({ key, label }));
const allowedKey = (role, key) => MENU_CATALOG.some((m) => m.key === key && m.roles.includes(role));

module.exports = { MENU_CATALOG, menuForRole, allowedKey };
