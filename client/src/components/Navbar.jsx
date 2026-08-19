import { Link, NavLink } from 'react-router-dom';

const navLink = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-teal-700' : 'text-gray-600 hover:text-teal-700'
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white font-bold">
            T
          </span>
          <span className="text-lg font-bold text-gray-900">TurRota</span>
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" end className={navLink}>
            Ana Sayfa
          </NavLink>
          <NavLink to="/turlar" className={navLink}>
            Turlar
          </NavLink>
          <NavLink to="/iletisim" className={navLink}>
            İletişim
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
