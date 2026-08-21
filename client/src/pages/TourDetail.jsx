import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ConsultantCard from '../components/ConsultantCard';
import RouteMap from '../components/RouteMap';
import TourBookingWidget from '../components/TourBookingWidget';
import useJsonLd from '../lib/useJsonLd';
import useSeo from '../lib/useSeo';
import { TOUR_TYPE_BY_VALUE } from '../lib/tourRouting';

// Detail page for a single tour at /tours/:slug — replaces the old
// per-category CategoryDetail, now generic across Package/Daily/Activity
// (the `type` on the tour itself drives the breadcrumb, schema.org
// touristType, and which contact-message item_type the enquiry is tagged
// with).
export default function TourDetail({ slug }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const trackRef = useRef(null);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/tours/${slug}`)
      .then((res) => {
        if (active) {
          setItem(res.data);
          setActiveImage(0);
        }
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

  const typeMeta = item ? TOUR_TYPE_BY_VALUE[item.type] : null;

  useSeo(
    item ? item.seo_title || item.title : undefined,
    item ? item.seo_description || item.summary || item.description : undefined
  );

  // SEO structured data (schema.org TouristTrip) so search engines can show
  // rich results (price, availability) for this listing.
  useJsonLd(
    item
      ? {
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: item.title,
          description: item.summary || item.description || undefined,
          image:
            item.images && item.images.length
              ? item.images.map((img) => img.url)
              : item.cover_image
                ? [item.cover_image]
                : undefined,
          touristType: typeMeta?.label,
          itinerary:
            item.itinerary && item.itinerary.length
              ? item.itinerary.map((day) => ({
                  '@type': 'Action',
                  name: day.title || `Day ${day.day_number}`,
                  description: day.details || undefined,
                }))
              : undefined,
          offers: {
            '@type': 'Offer',
            price: item.price || undefined,
            priceCurrency: item.currency || 'USD',
            availability: 'https://schema.org/InStock',
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          },
          provider: {
            '@type': 'TravelAgency',
            name: 'TurRota',
          },
        }
      : null
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-gray-500 sm:px-6">Loading...</div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Tour not found</h1>
        <p className="mt-2 text-gray-500">
          This tour may have been removed or is not published.
        </p>
        <Link to="/tours" className="btn-primary mt-6 inline-flex">
          Back to Tours
        </Link>
      </div>
    );
  }

  const images =
    item.images && item.images.length
      ? item.images
      : item.cover_image
        ? [{ url: item.cover_image }]
        : [];

  // Scrolls the main slider to a given slide — used by the thumbnail strip
  // and the photo gallery grid below (the "sub galleries"). The main
  // slider itself is navigated by swiping/dragging, not by clicking.
  function goToImage(idx) {
    setActiveImage(idx);
    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
    }
  }

  // Keeps activeImage (and therefore the thumbnail highlight) in sync while
  // the visitor swipes/scrolls the main slider by hand.
  function handleTrackScroll() {
    const track = trackRef.current;
    if (!track) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setActiveImage(idx);
    }, 100);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/tours" className="hover:text-teal-700">
          Tours
        </Link>
        {typeMeta && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/tours/${typeMeta.urlSlug}`} className="hover:text-teal-700">
              {typeMeta.pluralLabel}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-700">{item.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* --- Gallery --- */}
          {/* Main slider: swipe/drag to move between photos (scroll-snap) —
              it is intentionally not clickable itself. */}
          <div
            ref={trackRef}
            onScroll={handleTrackScroll}
            className="flex aspect-[16/9] w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-gray-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.length > 0 ? (
              images.map((img, idx) => (
                <div key={img.id || idx} className="h-full w-full flex-shrink-0 snap-center">
                  <img
                    src={img.url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
              ))
            ) : (
              <div className="flex h-full w-full flex-shrink-0 items-center justify-center text-gray-300">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => goToImage(idx)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === activeImage ? 'border-teal-700' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="mt-8 text-3xl font-bold text-gray-900">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
            {typeMeta && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700">
                {typeMeta.label}
              </span>
            )}
            {item.location && <span>📍 {item.location}</span>}
            <span>
              🗓️ {item.duration_days} {item.duration_days === 1 ? 'day' : 'days'}
              {item.duration_days > 1 ? `, ${item.duration_days - 1} nights` : ''}
            </span>
            {item.start_date && <span>▶️ Start date: {item.start_date}</span>}
            {item.capacity > 0 && <span>👥 Capacity: {item.capacity}</span>}
            {item.departure_point && item.departure_slug && (
              <Link
                to={`/tours/from-${item.departure_slug}`}
                className="hover:text-teal-700 hover:underline"
              >
                🚌 Departs from {item.departure_point}
              </Link>
            )}
          </div>

          {/* --- Overview --- */}
          {item.description && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900">Overview</h2>
              <div className="prose mt-3 max-w-none whitespace-pre-line text-gray-700">
                {item.description}
              </div>
            </div>
          )}

          {/* --- Route / map --- */}
          {item.route && item.route.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">Route</h2>
              <div className="mt-4">
                <RouteMap points={item.route} />
              </div>
            </div>
          )}

          {/* --- Itinerary timeline --- */}
          {item.itinerary && item.itinerary.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">Itinerary</h2>
              <ol className="relative mt-6 space-y-8 border-l-2 border-teal-100 pl-8">
                {item.itinerary.map((day) => (
                  <li key={day.id} className="relative">
                    <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white ring-4 ring-white">
                      {String(day.day_number).padStart(2, '0')}
                    </span>
                    <p className="text-base font-semibold text-teal-700">
                      {day.title || `Day ${day.day_number}`}
                    </p>
                    {day.details && (
                      <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                        {day.details}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* --- Included / excluded --- */}
          {(item.included?.length > 0 || item.excluded?.length > 0) && (
            <div className="mt-10 rounded-2xl bg-gray-50 p-6">
              <h2 className="text-lg font-bold text-gray-900">What's Included / Excluded</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Included</p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    {(item.included || []).map((i, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 text-teal-600">✓</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Excluded</p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    {(item.excluded || []).map((i, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 text-red-400">✕</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* --- Photo gallery --- */}
          {images.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-gray-900">Photo Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      goToImage(idx);
                      trackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- Sidebar --- */}
        <div className="space-y-6">
          <div className="card p-5">
            {item.duration_days > 0 && (
              <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-800">
                  {item.duration_days} {item.duration_days === 1 ? 'Day' : 'Days'}
                  {item.duration_days > 1 ? `, ${item.duration_days - 1} Nights` : ''}
                </span>
              </div>
            )}
            {item.languages?.length > 0 && (
              <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">Languages</span>
                <span className="font-medium text-gray-800">{item.languages.join(', ')}</span>
              </div>
            )}
            {item.highlights?.length > 0 && (
              <div className="py-2">
                <p className="mb-2 text-sm text-gray-500">Highlights</p>
                <ul className="space-y-1.5 text-sm">
                  {item.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <span className="text-teal-600">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <TourBookingWidget item={item} />

          <ConsultantCard />
        </div>
      </div>
    </div>
  );
}
