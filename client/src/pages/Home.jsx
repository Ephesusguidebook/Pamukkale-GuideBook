import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TourCard from '../components/TourCard';
import { TOUR_TYPES } from '../lib/tourRouting';
import { usePageContent } from '../PageContentContext';
import { calculateTourPrice } from '../lib/pricing';
import useSeo from '../lib/useSeo';

function formatPrice(price, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price || 0);
  } catch {
    return `${price} ${currency || ''}`;
  }
}

// Intro paragraph — long text is cut to a fixed character budget with a
// "Read More" toggle, so the hero never grows too tall on shorter screens
// no matter how much an admin writes into the Page Content editor.
const INTRO_CHAR_LIMIT = 150;

function IntroText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > INTRO_CHAR_LIMIT;
  const shown = expanded || !needsTruncation ? text : `${text.slice(0, INTRO_CHAR_LIMIT).trim()}…`;

  return (
    <p className="mx-auto mt-4 max-w-xl text-gray-500">
      {shown}{' '}
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-semibold text-teal-700 hover:underline"
        >
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </p>
  );
}

function TypeSection({ type, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{type.pluralLabel}</h2>
        <Link
          to={`/tours/${type.urlSlug}`}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <TourCard key={item.id} tour={item} basePath="/tours" />
        ))}
      </div>
    </section>
  );
}

// Admin-curated ("Featured on homepage") tours — a separate, hand-picked
// spotlight section shown above the automatic per-type sections below it.
function PopularToursSection({ tours }) {
  if (!tours || tours.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Popular Tours</h2>
        <Link to="/tours" className="text-sm font-medium text-teal-700 hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.slice(0, 6).map((item) => (
          <TourCard key={item.id} tour={item} basePath="/tours" />
        ))}
      </div>
    </section>
  );
}

// "Tour Start" — the places tours depart from / are built around, reusing
// the Destinations content type (image + title + slug) as a visual card grid.
// Heading + paragraph are admin-editable under Admin > Page Content >
// "Home – Tour Starting Points section".
function DestinationStartSection({ items }) {
  const { h1, p } = usePageContent('homeTourStart', { h1: 'Tour Starting Points', p: '' });
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{h1}</h2>
          {p && <p className="mt-1 text-sm text-gray-500">{p}</p>}
        </div>
        <Link to="/destinations" className="flex-shrink-0 text-sm font-medium text-teal-700 hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        {items.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            to={`/destinations/${item.slug}`}
            className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
              {item.cover_image ? (
                <img
                  src={item.cover_image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  No image
                </div>
              )}
            </div>
            <p className="p-3 text-center text-sm font-semibold text-gray-900">{item.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Admin-curated ("Featured on homepage") transfer routes, 2 rows of 3.
// Transfer Routes have no cover image of their own, so these are compact
// text cards (pickup → drop-off, duration, a live "from" price) rather
// than the photo cards used for Tours/Destinations.
function TransferSection({ routes, markupRates }) {
  if (!routes || routes.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transfers</h2>
        <Link to="/transfer" className="text-sm font-medium text-teal-700 hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {routes.slice(0, 6).map((route) => {
          const price = calculateTourPrice({ tour: route, partySize: 1, role: 'customer', markupRates });
          return (
            <Link
              key={route.id}
              to={`/transfer/${route.slug}`}
              className="card group p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="truncate">{route.pickup_location}</span>
                <span className="flex-shrink-0 text-teal-600">→</span>
                <span className="truncate">{route.dropoff_location}</span>
              </div>
              {route.duration_text && (
                <p className="mt-1 text-xs text-gray-500">{route.duration_text}</p>
              )}
              {price.total > 0 && (
                <p className="mt-4 text-base font-bold text-teal-700">
                  from {formatPrice(price.total, route.currency)}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function BlogSection({ posts }) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">From the Blog</h2>
        <Link to="/blog" className="text-sm font-medium text-teal-700 hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  No image
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                {formatDate(post.created_at)}
              </p>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { h1, p, seo_title, seo_description } = usePageContent('home', {
    h1: 'Find your dream tour and hit the road',
    p: 'Explore our carefully curated package tours, daily tours and activities. Detailed itineraries, transparent pricing and easy communication.',
  });
  useSeo(seo_title || h1, seo_description || p);

  const [tours, setTours] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [transferRoutes, setTransferRoutes] = useState([]);
  const [markupRates, setMarkupRates] = useState({});
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/tours'),
      api.get('/blog'),
      api.get('/destinations'),
      api.get('/transfer-routes'),
      api.get('/settings'),
    ])
      .then(([toursRes, blog, dest, transfers, settings]) => {
        if (!active) return;
        setTours(toursRes.data);
        setBlogPosts(blog.data);
        setDestinations(dest.data);
        setTransferRoutes(transfers.data);
        setMarkupRates({
          agency_markup_percent: settings.data.agency_markup_percent,
          customer_markup_percent: settings.data.customer_markup_percent,
        });
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
  }, []);

  const nothingPublished = !loading && !error && tours.length === 0;
  const featuredTours = tours.filter((t) => t.is_featured);
  const featuredTransfers = transferRoutes.filter((r) => r.is_featured);

  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
            Unforgettable Journeys
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-gray-900 sm:text-5xl">{h1}</h1>
          <IntroText text={p} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/tours/package" className="btn-primary bg-amber-500 hover:bg-amber-600">
              Explore Package Tours
            </Link>
            <Link to="/tours/daily" className="btn-secondary">
              Explore Daily Tours
            </Link>
          </div>
        </div>
      </section>

      {loading && <p className="mx-auto max-w-6xl px-4 py-10 text-gray-500 sm:px-6">Loading...</p>}
      {error && <p className="mx-auto max-w-6xl px-4 py-10 text-red-600 sm:px-6">{error}</p>}
      {nothingPublished && (
        <p className="mx-auto max-w-6xl px-4 py-10 text-gray-500 sm:px-6">
          Nothing published yet. Check back soon!
        </p>
      )}

      <DestinationStartSection items={destinations} />
      <PopularToursSection tours={featuredTours} />

      {TOUR_TYPES.map((type) => (
        <TypeSection key={type.value} type={type} items={tours.filter((t) => t.type === type.value)} />
      ))}

      <TransferSection routes={featuredTransfers} markupRates={markupRates} />
      <BlogSection posts={blogPosts} />
    </div>
  );
}
