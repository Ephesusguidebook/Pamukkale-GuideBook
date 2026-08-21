import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgencyAuth } from '../../AgencyAuthContext';

export default function AgencyLogin() {
  const { login } = useAgencyAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-14 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-gray-900">Agency Login</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Access your tour list, bookings and account statement.
      </p>
      <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
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
      <p className="mt-4 text-center text-xs text-gray-400">
        Don't have an agency account yet? Contact us to get set up.
      </p>
    </div>
  );
}
