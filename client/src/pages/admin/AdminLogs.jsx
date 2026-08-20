import { useEffect, useState } from 'react';
import api from '../../api';

const ENTITY_LABELS = {
  package_tour: 'Package Tour',
  daily_tour: 'Daily Tour',
  activity: 'Activity',
  blog_post: 'Blog Post',
  media: 'Media',
  media_folder: 'Media Folder',
  redirect: 'Redirect',
  settings: 'Settings',
  page_content: 'Page Content',
  auth: 'Login',
};

const ACTION_STYLES = {
  login: 'bg-teal-100 text-teal-700',
  create: 'bg-green-100 text-green-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700',
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/logs/activity', { params: { limit: 300 } })
      .then((res) => setLogs(res.data))
      .catch(() => setError('Could not load the activity log.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Activity Log</h1>
      <p className="mb-6 text-sm text-gray-500">
        A record of admin actions on the site — logins, and every create, update or delete.
        Shows the most recent 300 entries.
      </p>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="card p-10 text-center text-gray-500">No activity recorded yet.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.admin_email || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                        ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {ENTITY_LABELS[log.entity_type] || log.entity_type}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.entity_label || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
