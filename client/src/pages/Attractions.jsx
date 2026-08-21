import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import useSeo from '../lib/useSeo';

export default function Attractions() {
  useSeo('Attractions', 'Discover the top attractions across every destination we cover — entrance fees, opening hours, and visitor tips.');
  const [items, setItems] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const destinationFilter = searchParams.get('destination') || '';

  useEffect(() => {
    api
      .get('/destinations')
      .then((res) => setDestinations(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/attractions', { params: destinationFilter ? { destination: destinationFilter } : {} })
      .then((res) => {
        if (active) setItems(res.data);
      })
      .catch(() => {
        if (active) setError('Something went wrong while loading attractions.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [destinationFilter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Attractions</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Discover the top attractions across every destination we cover, with entrance fees, opening
        hours and visitor tips.
      </p>

      {destinations.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !destinationFilter ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSearchParams({ destination: d.slug })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                destinationFilter === d.slug ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="mt-8 text-gray-500">Loading...</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="mt-8 text-gray-500">No attractions match this filter yet.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/attraction/${item.slug}`}
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
              {item.entrance_fee && <p className="mt-2 text-xs font-medium text-teal-700">🎫 {item.entrance_fee}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
