import { Link, NavLink } from 'react-router-dom';
import { CATEGORIES } from '../lib/categories';

const navLink = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-teal-700' : 'text-gray-600 hover:text-teal-700'
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white font-bold">
            T
          </span>
          <span className="text-lg font-bold text-gray-900">TurRota</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-6">
          <NavLink to="/" end className={navLink}>
            Home
          </NavLink>
          <NavLink to={CATEGORIES.packageTours.publicPath} className={navLink}>
            Package Tours
          </NavLink>
          <NavLink to={CATEGORIES.dailyTours.publicPath} className={navLink}>
            Daily Tours
          </NavLink>
          <NavLink to={CATEGORIES.activities.publicPath} className={navLink}>
            Activities
          </NavLink>
          <NavLink to="/contact" className={navLink}>
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
