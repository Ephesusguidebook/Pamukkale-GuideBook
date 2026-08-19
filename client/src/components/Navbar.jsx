import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CATEGORY_LIST } from '../lib/categories';

const navLink = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-teal-700' : 'text-gray-600 hover:text-teal-700'
  }`;

export default function Navbar() {
  const [toursOpen, setToursOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
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

          <div
            className="relative"
            onMouseEnter={() => setToursOpen(true)}
            onMouseLeave={() => setToursOpen(false)}
          >
            <button
              type="button"
              onClick={() => setToursOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-teal-700"
            >
              Tours <span className="text-xs">▾</span>
            </button>
            {toursOpen && (
              <div className="absolute left-0 top-full w-48 rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                {CATEGORY_LIST.map((category) => (
                  <NavLink
                    key={category.key}
                    to={category.publicPath}
                    className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-teal-50 hover:text-teal-700"
                  >
                    {category.pluralLabel}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/blog" className={navLink}>
            Blog
          </NavLink>
          <NavLink to="/about-us" className={navLink}>
            About Us
          </NavLink>
          <NavLink to="/contact" className={navLink}>
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
