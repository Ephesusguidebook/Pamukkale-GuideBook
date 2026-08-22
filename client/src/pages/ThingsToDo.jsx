import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import TourCard from '../components/TourCard';
import useJsonLd from '../lib/useJsonLd';
import useSeo from '../lib/useSeo';

// "/things-to-do/:slug" — a dedicated SEO landing page + tour-discovery hub
// per Destination. Deliberately NOT a second copy of the Tours catalog: it
// reuses the exact "GET /destinations/:slug" endpoint the Destination
// detail page already calls (same tours/attractions/transfers, one
// round-trip), but leads with its own title/paragraph and — beyond the
// Tour cards — lists Attractions and Transfers as plain text links rather
// than a second row of cards, so the page reads as a curated guide rather
// than a duplicate listing.
export default function ThingsToDo() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/destinations/${slug}`)
      .then((res) => {
        if (active) setItem(res.data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const title = item ? `Things To Do in ${item.title}` : undefined;
  const intro = item
    ? item.summary || `Discover the best tours, must-see places and transfers in and around ${item.title}.`
    : undefined;

  useSeo(title, intro);

  const tours = item ? item.tours || [] : [];
  const attractions = item ? item.attractions || [] : [];
  const transfers = item ? item.transfers || [] : [];

  useJsonLd(
    item
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: title,
              description: intro,
              url: typeof window !== 'undefined' ? window.location.href : undefined,
              about: { '@type': 'TouristDestination', name: item.title, url: `${origin}/destinations/${item.slug}` },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Destinations', item: `${origin}/destinations` },
                { '@type': 'ListItem', position: 2, name: item.title, item: `${origin}/destinations/${item.slug}` },
                { '@type': 'ListItem', position: 3, name: 'Things To Do', item: typeof window !== 'undefined' ? window.location.href : undefined },
              ],
            },
          ],
        }
      : null
  );

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-gray-500 sm:px-6">Loading...</div>;
  }

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Destination not found</h1>
        <p className="mt-2 text-gray-500">This destination may have been removed or is not published.</p>
        <Link to="/destinations" className="btn-primary mt-6 inline-flex">
          Back to Destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/destinations" className="hover:text-teal-700">
          Destinations
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/destinations/${item.slug}`} className="hover:text-teal-700">
          {item.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Things To Do</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-gray-500">{intro}</p>

      {tours.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => (
            <TourCard key={t.id} tour={t} basePath="/tours" />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-gray-500">
          No tours are linked to {item.title} yet —{' '}
          <Link to="/tours" className="font-semibold text-teal-700 hover:underline">
            browse all tours
          </Link>{' '}
          instead.
        </p>
      )}

      {attractions.length > 0 && (
        <div className="mt-10 rounded-2xl bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Must-See Places in {item.title}</h2>
          <p className="mt-3 leading-loose text-gray-600">
            {attractions.map((a, idx) => (
              <span key={a.id}>
                <Link to={`/attraction/${a.slug}`} className="font-medium text-teal-700 hover:underline">
                  {a.title}
                </Link>
                {idx < attractions.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="mt-6 rounded-2xl bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Transfers to/from {item.title}</h2>
          <p className="mt-3 leading-loose text-gray-600">
            {transfers.map((r, idx) => (
              <span key={r.id}>
                <Link to={`/transfer/${r.slug}`} className="font-medium text-teal-700 hover:underline">
                  {r.pickup_location} ↔ {r.dropoff_location}
                </Link>
                {idx < transfers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
