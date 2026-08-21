import { useState } from 'react';
import agencyApi from '../../agencyApi';

export default function AgencySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setStatus('saving');
    try {
      await agencyApi.post('/agency/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setStatus('saved');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Could not change your password.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="card max-w-md p-6">
        <h2 className="font-semibold text-gray-900">Change Password</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {status === 'saved' && <p className="text-sm text-emerald-600">Password updated.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
