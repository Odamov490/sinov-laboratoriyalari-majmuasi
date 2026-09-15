import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { FlaskConical, LogOut } from 'lucide-react';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import { Loading } from '../components/StateViews.jsx';

export default function StaffCabinetLayout() {
  const { staff, loading, logout } = useStaffAuth();

  if (loading) return <Loading />;
  if (!staff) return <Navigate to="/kabinet/kirish" replace />;

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <header className="bg-white border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/kabinet" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <FlaskConical className="h-5 w-5" />
            </span>
            <span className="font-bold text-primary text-sm">Xodim kabineti</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-ink hidden sm:inline">{staff.fullName}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
            >
              <LogOut className="h-4 w-4" /> Chiqish
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 container-page py-8">
        <Outlet />
      </main>
    </div>
  );
}
