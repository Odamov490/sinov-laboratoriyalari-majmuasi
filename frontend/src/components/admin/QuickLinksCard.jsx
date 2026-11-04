import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { menuItemsForRole } from '../../layouts/AdminLayout.jsx';

// Dashboard: profildagi "Sevimli bo'limlar" (hamma rol, STAFF ham).
export default function QuickLinksCard() {
  const { user } = useAuth();
  const items = menuItemsForRole(user.role);
  const favorites = (user.preferences?.favorites || []).map((k) => items.find((i) => i.key === k)).filter(Boolean);
  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Star className="h-4 w-4 text-primary" /> Tezkor havolalar
        </p>
        <Link to="/admin/mening-profilim?tab=sozlamalar" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
          <Settings2 className="h-3.5 w-3.5" /> Sozlash
        </Link>
      </div>
      {favorites.length === 0 ? (
        <p className="text-sm text-slate-400">Sevimli bo'limlarni profil sozlamalarida tanlang — ular shu yerda va yon menyuning tepasida chiqadi.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {favorites.map((f) => (
            <Link key={f.key} to={f.to} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg-light">
              <f.icon className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{f.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
