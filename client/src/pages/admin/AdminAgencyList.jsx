import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

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

export default function AdminAgencyList() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/admin/agencies')
      .then((res) => setAgencies(res.data))
      .catch(() => setError('Could not load agencies.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(agency) {
    if (!window.confirm(`Are you sure you want to delete "${agency.company_name || agency.email}"?`)) return;
    try {
      await api.delete(`/admin/agencies/${agency.id}`);
      setAgencies((prev) => prev.filter((a) => a.id !== agency.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Agencies</h1>
        <Link to="/admin/agencies/new" className="btn-primary">
          + Add Agency
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && agencies.length === 0 && (
        <div className="card p-10 text-center text-gray-500">
          No agencies yet. Register one with "Add Agency" to give it its own login at /agency/login.
        </div>
      )}

      <div className="space-y-3">
        {agencies.map((a) => (
          <div key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{a.company_name || a.email}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === 'suspended' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {a.status === 'suspended' ? 'Suspended' : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {a.email} {a.contact_name && `· ${a.contact_name}`}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {a.booking_count} booking(s), {a.pending_bookings} pending · Last login:{' '}
                {a.last_login_at ? new Date(a.last_login_at).toLocaleDateString('en-US') : 'never'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs uppercase text-gray-400">Balance</p>
                <p className={`text-sm font-bold ${a.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatPrice(Math.abs(a.balance), 'EUR')} {a.balance > 0 ? 'owed' : ''}
                </p>
              </div>
              <Link to={`/admin/agencies/${a.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">
                Manage
              </Link>
              <button onClick={() => handleDelete(a)} className="btn-danger !px-3 !py-1.5 text-xs">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
