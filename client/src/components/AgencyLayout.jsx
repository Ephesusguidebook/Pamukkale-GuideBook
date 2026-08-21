import { NavLink, Outlet } from 'react-router-dom';
import { useAgencyAuth } from '../AgencyAuthContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
  }`;

export default function AgencyLayout() {
  const { agency, logout } = useAgencyAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lg font-bold text-gray-900">Agency Portal</span>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/agency" end className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/agency/tours" className={linkClass}>
                Tours
              </NavLink>
              <NavLink to="/agency/bookings" className={linkClass}>
                My Bookings
              </NavLink>
              <NavLink to="/agency/ledger" className={linkClass}>
                Ön Muhasebe
              </NavLink>
              <NavLink to="/agency/settings" className={linkClass}>
                Settings
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{agency?.company_name || agency?.email}</span>
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
