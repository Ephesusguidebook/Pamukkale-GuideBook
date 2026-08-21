import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAgencyAuth } from '../../AgencyAuthContext';
import { usePageContent } from '../../PageContentContext';
import useSeo from '../../lib/useSeo';

// Simple stroke icons, same visual language as the ones on the Contact page
// (viewBox 24x24, currentColor stroke) — one per service line we operate on
// behalf of partner agencies.
function TourIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" />
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 12h.01M15 12h.01M12 8h.01" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4 16V11a1 1 0 0 1 .3-.7l2-2A1 1 0 0 1 7 8h10a1 1 0 0 1 .7.3l2 2a1 1 0 0 1 .3.7v5" />
      <path d="M4 16h16" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  );
}

function ShoreExcursionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="5" r="1.8" />
      <path d="M12 7v10" />
      <path d="M8 11h8" />
      <path d="M4 15c1 3 4.5 5 8 5s7-2 8-5" />
    </svg>
  );
}

const SERVICES = [
  { icon: <TourIcon />, label: 'Tours' },
  { icon: <HotelIcon />, label: 'Hotels' },
  { icon: <TransferIcon />, label: 'Transfers' },
  { icon: <ShoreExcursionIcon />, label: 'Shore Excursions' },
];

export default function AgencyLogin() {
  const { login } = useAgencyAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { h1, p, seo_title, seo_description } = usePageContent('agencyLogin', {
    h1: 'Your Local Operator in the Ephesus Region',
    p: 'We partner with overseas travel agencies to run their operations in Turkey — handling Tours, Hotels, Transfers and Shore Excursions across the Ephesus region so you can focus on selling, not logistics.',
  });
  useSeo(seo_title || h1, seo_description || p);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const to = location.state?.from || '/agency';
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* --- Hero: mission statement + the 4 service lines we operate --- */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-4xl">{h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500">{p}</p>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {SERVICES.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                  {s.icon}
                </div>
                <p className="text-sm font-medium text-gray-700">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- How it works + Log in --- */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-2 text-sm text-gray-500">
              A straightforward partnership, built for agencies who want a reliable operator
              on the ground in Turkey.
            </p>
            <ol className="mt-6 space-y-5">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-800">Get in touch</p>
                  <p className="text-sm text-gray-500">
                    Tell us about your agency and the volume of guests you send to the Ephesus
                    region.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-800">We set up your account</p>
                  <p className="text-sm text-gray-500">
                    We agree on your net rates and create your private agency login — no
                    public sign-up, set up by us directly.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-800">We run the ground operations</p>
                  <p className="text-sm text-gray-500">
                    Book Tours, Hotels, Transfers and Shore Excursions for your clients, track
                    every booking and your account statement online.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-8 text-sm text-gray-500">
              New partner agency?{' '}
              <Link to="/contact" className="font-semibold text-teal-700 hover:underline">
                Contact us
              </Link>{' '}
              to get set up.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">Agency Login</h2>
            <p className="mt-2 text-sm text-gray-500">
              Already a partner? Access your tour list, bookings and account statement.
            </p>
            <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
