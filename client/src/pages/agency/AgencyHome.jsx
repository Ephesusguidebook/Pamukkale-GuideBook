import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import agencyApi from '../../agencyApi';

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${amount} ${currency || ''}`;
  }
}

export default function AgencyHome() {
  const [me, setMe] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      agencyApi.get('/agency/auth/me'),
      agencyApi.get('/agency/bookings'),
      agencyApi.get('/agency/ledger'),
    ])
      .then(([meRes, bookingsRes, ledgerRes]) => {
        setMe(meRes.data);
        setBookings(bookingsRes.data);
        setBalance(ledgerRes.data.balance);
        if (ledgerRes.data.entries[0]) setCurrency(ledgerRes.data.entries[0].currency);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Welcome{me?.contact_name ? `, ${me.contact_name}` : ''}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {me?.company_name} · Agency rate: {me ? Number(me.effective_markup_percent) : '—'}% markup
      </p>

      {loading ? (
        <p className="mt-8 text-gray-500">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/agency/bookings" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase text-gray-400">Pending Requests</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{pending}</p>
          </Link>
          <Link to="/agency/bookings" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase text-gray-400">Confirmed Bookings</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">{confirmed}</p>
          </Link>
          <Link to="/agency/ledger" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase text-gray-400">Current Balance</p>
            <p className={`mt-1 text-3xl font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatPrice(Math.abs(balance), currency)}
            </p>
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/agency/tours" className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="font-semibold text-gray-900">Browse Tours</p>
          <p className="mt-1 text-sm text-gray-500">See every published tour at your agency rate and request a booking.</p>
        </Link>
        <Link to="/agency/bookings" className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="font-semibold text-gray-900">My Bookings</p>
          <p className="mt-1 text-sm text-gray-500">Track your booking requests and register your customers' passport details.</p>
        </Link>
      </div>
    </div>
  );
}
