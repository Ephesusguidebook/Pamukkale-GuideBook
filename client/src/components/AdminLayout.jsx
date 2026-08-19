import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
  }`;

export default function AdminLayout() {
  const { email, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900">TurRota Admin</span>
            <nav className="flex gap-1">
              <NavLink to="/admin" end className={linkClass}>
                Turlar
              </NavLink>
              <NavLink to="/admin/turlar/yeni" className={linkClass}>
                Yeni Tur
              </NavLink>
              <NavLink to="/admin/mesajlar" className={linkClass}>
                Mesajlar
              </NavLink>
              <NavLink to="/admin/ayarlar" className={linkClass}>
                Ayarlar
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{email}</span>
            <button onClick={logout} className="btn-secondary !px-3 !py-1.5 text-xs">
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
