import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import api from '../api';

const navLink = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-teal-700' : 'text-gray-600 hover:text-teal-700'
  }`;

const COMPANY_LINKS = [
  { to: '/about-us', label: 'About Us' },
  { to: '/terms-and-conditions', label: 'Terms and Conditions' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const [companyOpen, setCompanyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logo, setLogo] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/settings')
      .then((res) => {
        if (active) setLogo(res.data.site_logo || '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          {logo ? (
            <img src={logo} alt="TurRota" className="h-9 w-auto object-contain" />
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white font-bold">
                T
              </span>
              <span className="text-lg font-bold text-gray-900">TurRota</span>
            </>
          )}
        </Link>

        {/* --- Desktop nav --- */}
        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/" end className={navLink}>
            Home
          </NavLink>
          <NavLink to="/tours" className={navLink}>
            Tours
          </NavLink>
          <NavLink to="/transfer" className={navLink}>
            Transfer
          </NavLink>
          <NavLink to="/destinations" className={navLink}>
            Destinations
          </NavLink>
          <NavLink to="/attraction" className={navLink}>
            Attractions
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setCompanyOpen(true)}
            onMouseLeave={() => setCompanyOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCompanyOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-teal-700"
            >
              Company <span className="text-xs">▾</span>
            </button>
            {companyOpen && (
              <div className="absolute left-0 top-full w-56 rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                {COMPANY_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-teal-50 hover:text-teal-700"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/blog" className={navLink}>
            Blog
          </NavLink>
          <NavLink to="/contact" className={navLink}>
            Contact
          </NavLink>
        </nav>

        {/* --- Mobile hamburger --- */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 sm:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <span className="text-2xl leading-none">✕</span>
          ) : (
            <span className="text-2xl leading-none">☰</span>
          )}
        </button>
      </div>

      {/* --- Mobile menu panel --- */}
      {mobileOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/tours" className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Tours
            </NavLink>
            <NavLink to="/transfer" className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Transfer
            </NavLink>
            <NavLink to="/destinations" className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Destinations
            </NavLink>
            <NavLink to="/attraction" className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Attractions
            </NavLink>

            <p className="mt-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Company
            </p>
            {COMPANY_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 border-t border-gray-100 pt-2">
              <NavLink to="/blog" className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
                Blog
              </NavLink>
              <NavLink to="/contact" className="rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
                Contact
              </NavLink>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
