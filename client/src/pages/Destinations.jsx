import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import useSeo from '../lib/useSeo';

export default function Destinations() {
  useSeo('Destinations', 'Explore the destinations we cover — with the top attractions, visitor tips, and everything you need to plan your visit.');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/destinations')
      .then((res) => {
        if (active) setItems(res.data);
      })
      .catch(() => {
        if (active) setError('Something went wrong while loading destinations.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Explore the places we cover — each with its own top attractions, visitor tips, and a photo
        gallery to help you plan your trip.
      </p>

      {loading && <p className="mt-8 text-gray-500">Loading...</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="mt-8 text-gray-500">No destinations published yet. Check back soon!</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/destinations/${item.slug}`}
            className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {item.cover_image ? (
                <img
                  src={item.cover_image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">No image</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{item.title}</h3>
              {item.summary && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.summary}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
