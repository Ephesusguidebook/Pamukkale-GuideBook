import { useEffect, useState } from 'react';
import api from '../../api';

const emptyForm = { from_path: '', to_path: '', status_code: 301 };

export default function AdminRedirects() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    return api
      .get('/admin/redirects')
      .then((res) => setRedirects(res.data))
      .catch(() => setError('Could not load redirects.'))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.from_path.trim() || !form.to_path.trim()) {
      setError('Both paths are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/redirects', form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create redirect.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this redirect?')) return;
    try {
      await api.delete(`/admin/redirects/${id}`);
      await load();
    } catch {
      setError('Could not delete redirect.');
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Redirects</h1>
      <p className="mb-6 text-sm text-gray-500">
        When you delete a page or rename a tour/activity/blog post (which changes its URL),
        add a redirect here so visitors and search engines are sent to the new page instead
        of a "not found" error.
      </p>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-6">
        <h2 className="font-semibold text-gray-800">Add Redirect</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Old Path (from)</label>
            <input
              className="input"
              placeholder="/package-tours/old-tour-name (or any old URL)"
              value={form.from_path}
              onChange={(e) => setForm((f) => ({ ...f, from_path: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">New Path (to)</label>
            <input
              className="input"
              placeholder="/tours/tour-name"
              value={form.to_path}
              onChange={(e) => setForm((f) => ({ ...f, to_path: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Redirect Type</label>
          <select
            className="input sm:w-64"
            value={form.status_code}
            onChange={(e) => setForm((f) => ({ ...f, status_code: Number(e.target.value) }))}
          >
            <option value={301}>301 — Permanent (recommended)</option>
            <option value={302}>302 — Temporary</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Adding...' : 'Add Redirect'}
        </button>
      </form>

      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-gray-800">Active Redirects</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : redirects.length === 0 ? (
          <p className="text-sm text-gray-400">No redirects yet.</p>
        ) : (
          <div className="space-y-2">
            {redirects.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {r.from_path}
                  </code>
                  <span className="text-gray-400">→</span>
                  <code className="rounded bg-teal-50 px-2 py-1 text-xs text-teal-700">
                    {r.to_path}
                  </code>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                    {r.status_code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
