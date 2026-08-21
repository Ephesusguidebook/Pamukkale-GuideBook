import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminTransferList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/admin/transfer-routes')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load transfer routes.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(item) {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?\n\nIts page (/transfer/${item.slug}) will start returning "not found".`))
      return;
    try {
      await api.delete(`/admin/transfer-routes/${item.id}`);
      setItems((prev) => prev.filter((t) => t.id !== item.id));
    } catch {
      alert('Delete failed.');
    }
  }

  async function toggleStatus(item) {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.put(`/admin/transfer-routes/${item.id}`, { ...item, status: newStatus });
      setItems((prev) => prev.map((t) => (t.id === item.id ? res.data : t)));
    } catch {
      alert('Could not update status.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Transfer Routes</h1>
        <Link to="/admin/transfers/new" className="btn-primary">
          + Add Transfer Route
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="card p-10 text-center text-gray-500">
          No transfer routes added yet. Start with "Add Transfer Route".
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {item.pickup_location} ↔ {item.dropoff_location}
              </p>
              <p className="text-sm text-gray-500">
                {item.title} {item.duration_text ? `· ${item.duration_text}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(item)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {item.status === 'published' ? 'Published' : 'Draft'}
              </button>
              <Link to={`/admin/transfers/${item.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">
                Edit
              </Link>
              <button onClick={() => handleDelete(item)} className="btn-danger !px-3 !py-1.5 text-xs">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
