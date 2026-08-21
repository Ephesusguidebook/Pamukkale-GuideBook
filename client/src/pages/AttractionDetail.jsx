import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import GoogleMapEmbed from '../components/GoogleMapEmbed';
import useJsonLd from '../lib/useJsonLd';
import useSeo from '../lib/useSeo';

export default function AttractionDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/attractions/${slug}`)
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

  useSeo(
    item ? item.seo_title || item.title : undefined,
    item ? item.seo_description || item.summary : undefined
  );

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const imageUrls = item ? (item.images || []).map((img) => img.url).filter(Boolean) : [];

  useJsonLd(
    item
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'TouristAttraction',
              name: item.title,
              description: item.summary || item.description || undefined,
              image: imageUrls.length ? imageUrls : item.cover_image ? [item.cover_image] : undefined,
              url: typeof window !== 'undefined' ? window.location.href : undefined,
              openingHours: item.opening_hours || undefined,
              geo:
                item.latitude != null && item.longitude != null
                  ? { '@type': 'GeoCoordinates', latitude: item.latitude, longitude: item.longitude }
                  : undefined,
              containedInPlace: item.destination
                ? {
                    '@type': 'TouristDestination',
                    name: item.destination.title,
                    url: `${origin}/destinations/${item.destination.slug}`,
                  }
                : undefined,
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Attractions', item: `${origin}/attraction` },
                ...(item.destination
                  ? [
                      {
                        '@type': 'ListItem',
                        position: 2,
                        name: item.destination.title,
                        item: `${origin}/destinations/${item.destination.slug}`,
                      },
                    ]
                  : []),
                {
                  '@type': 'ListItem',
                  position: item.destination ? 3 : 2,
                  name: item.title,
                  item: typeof window !== 'undefined' ? window.location.href : undefined,
                },
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
        <h1 className="text-2xl font-bold text-gray-900">Attraction not found</h1>
        <p className="mt-2 text-gray-500">This attraction may have been removed or is not published.</p>
        <Link to="/attraction" className="btn-primary mt-6 inline-flex">
          Back to Attractions
        </Link>
      </div>
    );
  }

  const nearby = item.nearby || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/attraction" className="hover:text-teal-700">
          Attractions
        </Link>
        {item.destination && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/destinations/${item.destination.slug}`} className="hover:text-teal-700">
              {item.destination.title}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-700">{item.title}</span>
      </nav>

      {item.cover_image && (
        <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl bg-gray-100">
          <img src={item.cover_image} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}

      <h1 className="mt-8 text-3xl font-bold text-gray-900">{item.title}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-gray-400">Giriş Ücreti</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{item.entrance_fee || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Açık Saatleri</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{item.opening_hours || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Best Time</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{item.best_time || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Location</p>
          {item.destination ? (
            <Link to={`/destinations/${item.destination.slug}`} className="mt-0.5 block text-sm font-semibold text-teal-700 hover:underline">
              {item.destination.title}
            </Link>
          ) : (
            <p className="mt-0.5 text-sm font-semibold text-gray-800">—</p>
          )}
        </div>
      </div>

      {item.description && (
        <div className="prose mt-8 max-w-none whitespace-pre-line text-gray-700">{item.description}</div>
      )}

      {item.visitor_information && (
        <div className="mt-10 rounded-2xl bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Visitor Information</h2>
          <div className="prose mt-3 max-w-none whitespace-pre-line text-sm text-gray-700">
            {item.visitor_information}
          </div>
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">Photo Gallery</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(item.images || []).map((img, idx) => (
              <div key={img.id || idx} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {item.latitude != null && item.longitude != null && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">Location</h2>
          <div className="mt-4">
            <GoogleMapEmbed lat={item.latitude} lng={item.longitude} title={item.title} />
          </div>
        </div>
      )}

      {nearby.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">Yakın Konumlar</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((a) => (
              <Link
                key={a.id}
                to={`/attraction/${a.slug}`}
                className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  {a.cover_image ? (
                    <img
                      src={a.cover_image}
                      alt={a.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{a.title}</h3>
                  {a.entrance_fee && <p className="mt-1 text-sm text-gray-500">🎫 {a.entrance_fee}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
