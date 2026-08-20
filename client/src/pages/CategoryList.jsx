import { useEffect, useState } from 'react';
import api from '../api';
import TourCard from '../components/TourCard';
import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';

// Generic listing page reused for Package Tours, Daily Tours and Activities.
// `category` comes from src/lib/categories.js and drives the API endpoint,
// the URL prefix used for links, and the on-page copy.
export default function CategoryList({ category }) {
  const { h1, p, seo_title, seo_description } = usePageContent(category.pageKey, {
    h1: category.heading,
    p: category.intro,
  });
  useSeo(seo_title || h1, seo_description || p);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(category.apiBase)
      .then((res) => {
        if (active) setItems(res.data);
      })
      .catch(() => {
        if (active) setError('Something went wrong while loading this page.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category.apiBase]);

  const filtered = items.filter((t) =>
    `${t.title} ${t.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{p}</p>
      </div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <input
          className="input sm:w-72"
          placeholder={category.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">
          {query ? 'Nothing matches your search.' : category.emptyMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <TourCard key={item.id} tour={item} basePath={category.publicPath} />
        ))}
      </div>
    </div>
  );
}
