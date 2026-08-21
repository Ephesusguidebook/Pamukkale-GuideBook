import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminDestinationList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/admin/destinations')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load destinations.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(item) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${item.title}"?\n\n` +
          `Its page (/destinations/${item.slug}) will start returning "not found", and any Attractions ` +
          `pointing at it will lose their auto-linked Location. If it's linked to from elsewhere, add a ` +
          `redirect afterwards in Admin > Redirects.`
      )
    )
      return;
    try {
      await api.delete(`/admin/destinations/${item.id}`);
      setItems((prev) => prev.filter((p) => p.id !== item.id));
    } catch {
      alert('Delete failed.');
    }
  }

  async function toggleStatus(item) {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.put(`/admin/destinations/${item.id}`, { ...item, status: newStatus });
      setItems((prev) => prev.map((p) => (p.id === item.id ? res.data : p)));
    } catch {
      alert('Could not update status.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/redirects" className="text-xs text-gray-500 hover:text-teal-700">
            Deleted or renamed one? Add a redirect →
          </Link>
          <Link to="/admin/destinations/new" className="btn-primary">
            + Add Destination
          </Link>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="card p-10 text-center text-gray-500">
          No destinations added yet. Start with "Add Destination".
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.cover_image ? <img src={item.cover_image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">/destinations/{item.slug}</p>
              </div>
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
              <Link to={`/admin/destinations/${item.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">
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
