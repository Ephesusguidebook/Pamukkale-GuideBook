import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TourCard from '../components/TourCard';
import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';
import { TOUR_TYPES } from '../lib/tourRouting';

function buildToursUrl(typeUrlSlug, departureSlug) {
  const parts = [];
  if (typeUrlSlug) parts.push(typeUrlSlug);
  if (departureSlug) parts.push(`from-${departureSlug}`);
  return parts.length ? `/tours/${parts.join('/')}` : '/tours';
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const chipClass = (active) =>
  `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-teal-700 bg-teal-700 text-white'
      : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:text-teal-700'
  }`;

// The single /tours listing page — handles the unfiltered page, a type-only
// filter (/tours/daily), a departure-only filter (/tours/from-kusadasi) and
// a combined filter (/tours/daily/from-kusadasi), all through the same
// component. `typeFilter`/`departureFilter` come from the Tours.jsx router
// dispatcher above this, which classifies the raw URL segments.
export default function TourListing({ typeFilter, departureFilter }) {
  const { h1: defaultH1, p: defaultP, seo_title, seo_description } = usePageContent('tours', {
    h1: 'Tours',
    p: 'Explore our package tours, daily tours and standalone activities.',
  });

  const [items, setItems] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (departureFilter) params.departure = departureFilter;
    api
      .get('/tours', { params })
      .then((res) => {
        if (active) setItems(res.data);
      })
      .catch(() => {
        if (active) setError('Something went wrong while loading tours.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [typeFilter, departureFilter]);

  useEffect(() => {
    let active = true;
    api
      .get('/tours/meta/departures')
      .then((res) => {
        if (active) setDepartures(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeType = TOUR_TYPES.find((t) => t.value === typeFilter);
  const activeDeparture = departures.find((d) => d.slug === departureFilter);
  const departureLabel = activeDeparture ? activeDeparture.label : departureFilter ? titleCase(departureFilter) : '';

  // Only the unfiltered page uses the admin-edited heading/copy — a filtered
  // page gets its own descriptive heading (and SEO title/description) so
  // each filter combination reads as a real, distinct page rather than a
  // duplicate of the main listing.
  let h1 = defaultH1;
  let intro = defaultP;
  if (activeType && departureFilter) {
    h1 = `${activeType.pluralLabel} from ${departureLabel}`;
    intro = `${activeType.intro} Showing tours departing from ${departureLabel}.`;
  } else if (activeType) {
    h1 = activeType.pluralLabel;
    intro = activeType.intro;
  } else if (departureFilter) {
    h1 = `Tours from ${departureLabel}`;
    intro = `Package tours, daily tours and activities departing from ${departureLabel}.`;
  }
  const isFiltered = !!(activeType || departureFilter);
  useSeo(isFiltered ? h1 : seo_title || defaultH1, isFiltered ? intro : seo_description || defaultP);

  const filtered = items.filter((t) =>
    `${t.title} ${t.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{intro}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link to={buildToursUrl(undefined, departureFilter)} className={chipClass(!typeFilter)}>
          All Types
        </Link>
        {TOUR_TYPES.map((t) => (
          <Link
            key={t.value}
            to={buildToursUrl(t.value === typeFilter ? undefined : t.urlSlug, departureFilter)}
            className={chipClass(typeFilter === t.value)}
          >
            {t.pluralLabel}
          </Link>
        ))}
      </div>

      {departures.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            to={buildToursUrl(activeType?.urlSlug, undefined)}
            className={chipClass(!departureFilter)}
          >
            Any Departure Point
          </Link>
          {departures.map((d) => (
            <Link
              key={d.slug}
              to={buildToursUrl(activeType?.urlSlug, d.slug === departureFilter ? undefined : d.slug)}
              className={chipClass(departureFilter === d.slug)}
            >
              From {d.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <input
          className="input sm:w-72"
          placeholder="Search tours or a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">
          {query ? 'Nothing matches your search.' : 'No tours published here yet. Check back soon!'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <TourCard key={item.id} tour={item} basePath="/tours" />
        ))}
      </div>
    </div>
  );
}
