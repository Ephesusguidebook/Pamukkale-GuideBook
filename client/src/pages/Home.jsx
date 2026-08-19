import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TourCard from '../components/TourCard';

export default function Home() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div>
      <section className="bg-gradient-to-b from-teal-700 to-teal-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-200">
            Unutulmaz Yolculuklar
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
            Hayalindeki turu bul, yola çık
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-teal-100">
            Özenle hazırlanmış paket turlarımızla keşfetmeye hazır ol. Detaylı program,
            şeffaf fiyatlar ve kolay iletişim.
          </p>
          <Link to="/turlar" className="btn-primary mt-8 bg-amber-500 hover:bg-amber-600">
            Turları Keşfet
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Öne Çıkan Turlar</h2>
          <Link to="/turlar" className="text-sm font-medium text-teal-700 hover:underline">
            Tümünü gör →
          </Link>
        </div>

        {loading && <p className="text-gray-500">Yükleniyor...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && tours.length === 0 && (
          <p className="text-gray-500">
            Henüz yayınlanmış bir tur yok. Yakında burada olacak!
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.slice(0, 6).map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>
    </div>
  );
}
