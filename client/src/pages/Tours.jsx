import { useEffect, useState } from 'react';
import api from '../api';
import TourCard from '../components/TourCard';

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/tours')
      .then((res) => {
        if (active) setTours(res.data);
      })
      .catch(() => {
        if (active) setError('Turlar yüklenirken bir sorun oluştu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = tours.filter((t) =>
    `${t.title} ${t.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tüm Turlar</h1>
        <input
          className="input sm:w-72"
          placeholder="Tur veya lokasyon ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">Aramanla eşleşen bir tur bulunamadı.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  );
}
