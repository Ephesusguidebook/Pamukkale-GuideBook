import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';
import { CATEGORY_LIST } from '../lib/categories';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
  }`;

export default function AdminLayout() {
  const { email, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lg font-bold text-gray-900">Admin Panel</span>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/admin" end className={linkClass}>
                Overview
              </NavLink>
              {CATEGORY_LIST.map((category) => (
                <NavLink key={category.key} to={category.adminPath} className={linkClass}>
                  {category.pluralLabel}
                </NavLink>
              ))}
              <NavLink to="/admin/blog" className={linkClass}>
                Blog
              </NavLink>
              <NavLink to="/admin/messages" className={linkClass}>
                Messages
              </NavLink>
              <NavLink to="/admin/page-content" className={linkClass}>
                Page Content
              </NavLink>
              <NavLink to="/admin/settings" className={linkClass}>
                Settings
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{email}</span>
            <button onClick={logout} className="btn-secondary !px-3 !py-1.5 text-xs">
              Log Out
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
