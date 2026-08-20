import { useEffect, useState } from 'react';
import api from '../../api';

const TABS = [
  { key: 'all', label: 'All Requests' },
  { key: 'bots', label: 'Bots & Crawlers' },
  { key: 'human', label: 'Visitors' },
  { key: 'errors', label: 'Errors (404s)' },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function AdminTraffic() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/logs/visits/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Could not load traffic stats.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setRowsLoading(true);
    const params = { limit: 150 };
    if (tab === 'bots') params.bots = '1';
    if (tab === 'human') params.human = '1';
    if (tab === 'errors') params.errors = '1';
    api
      .get('/admin/logs/visits', { params })
      .then((res) => setRows(res.data))
      .catch(() => setError('Could not load the traffic log.'))
      .finally(() => setRowsLoading(false));
  }, [tab]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Traffic &amp; Crawlers</h1>
      <p className="mb-6 text-sm text-gray-500">
        Which search-engine / AI bots crawl the site, any errors they hit along the way, and
        how many pages real visitors browse per session.
      </p>

      {loading && <p className="text-gray-500">Loading...</p>}

      {summary && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Page Requests" value={summary.totalVisits} />
            <StatCard label="Bot Visits" value={summary.botVisits} />
            <StatCard label="Visitor Requests" value={summary.humanVisits} />
            <StatCard
              label="Crawl Errors"
              value={summary.errorCount}
              sub={summary.errorCount > 0 ? '404s and other errors' : 'None found'}
            />
            <StatCard label="Visitor Sessions" value={summary.sessionCount} />
            <StatCard label="Avg Pages / Session" value={summary.avgPagesPerSession} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-gray-800">Top Bots</h2>
              {summary.topBots.length === 0 ? (
                <p className="text-sm text-gray-400">No bot activity recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {summary.topBots.map((b) => (
                    <div key={b.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{b.name}</span>
                      <span className="font-semibold text-gray-900">{b.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-gray-800">Recent Visitor Sessions</h2>
              {summary.recentSessions.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No visitor sessions recorded yet — this fills in as people browse the site.
                </p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {summary.recentSessions.map((s) => (
                    <div
                      key={s.session_id}
                      className="flex items-center justify-between border-b border-gray-50 pb-2 text-sm last:border-0"
                    >
                      <div>
                        <p className="text-gray-700">{formatDate(s.last_seen)}</p>
                        <p className="text-xs text-gray-400">Session {s.session_id.slice(0, 8)}</p>
                      </div>
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                        {s.pages} page{s.pages === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? 'bg-teal-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {rowsLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">Nothing to show here yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Visitor</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.path}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status_code >= 400
                          ? 'bg-red-100 text-red-700'
                          : r.status_code >= 300
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {r.status_code || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.is_bot ? (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        🤖 {r.bot_name}
                      </span>
                    ) : (
                      <span className="text-gray-500">Visitor</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {r.source === 'client' ? 'In-app navigation' : 'Page request'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
