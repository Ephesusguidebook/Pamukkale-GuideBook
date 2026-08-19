import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Dashboard() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/admin/tours')
      .then((res) => setTours(res.data))
      .catch(() => setError('Turlar yüklenemedi.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(tour) {
    if (!window.confirm(`"${tour.title}" turunu silmek istediğine emin misin?`)) return;
    try {
      await api.delete(`/admin/tours/${tour.id}`);
      setTours((prev) => prev.filter((t) => t.id !== tour.id));
    } catch {
      alert('Silme işlemi başarısız oldu.');
    }
  }

  async function toggleStatus(tour) {
    const newStatus = tour.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.put(`/admin/tours/${tour.id}`, { ...tour, status: newStatus });
      setTours((prev) => prev.map((t) => (t.id === tour.id ? res.data : t)));
    } catch {
      alert('Durum güncellenemedi.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Turlar</h1>
        <Link to="/admin/turlar/yeni" className="btn-primary">
          + Yeni Tur Ekle
        </Link>
      </div>

      {loading && <p className="text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && tours.length === 0 && (
        <div className="card p-10 text-center text-gray-500">
          Henüz tur eklenmemiş. "Yeni Tur Ekle" ile başla.
        </div>
      )}

      <div className="space-y-3">
        {tours.map((tour) => (
          <div
            key={tour.id}
            className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {tour.cover_image ? (
                  <img src={tour.cover_image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tour.title}</p>
                <p className="text-sm text-gray-500">
                  {tour.location || 'Lokasyon yok'} · {tour.duration_days} gün ·{' '}
                  {tour.price} {tour.currency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(tour)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tour.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tour.status === 'published' ? 'Yayında' : 'Taslak'}
              </button>
              <Link
                to={`/admin/turlar/${tour.id}`}
                className="btn-secondary !px-3 !py-1.5 text-xs"
              >
                Düzenle
              </Link>
              <button
                onClick={() => handleDelete(tour)}
                className="btn-danger !px-3 !py-1.5 text-xs"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
