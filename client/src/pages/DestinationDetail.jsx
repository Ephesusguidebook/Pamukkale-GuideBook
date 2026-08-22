import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import FaqAccordion from '../components/FaqAccordion';
import TourCard from '../components/TourCard';
import useJsonLd from '../lib/useJsonLd';
import useSeo from '../lib/useSeo';

export default function DestinationDetail() {
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
              '@type': 'TouristDestination',
              name: item.title,
              description: item.summary || item.description || undefined,
              image: imageUrls.length ? imageUrls : item.cover_image ? [item.cover_image] : undefined,
              url: typeof window !== 'undefined' ? window.location.href : undefined,
              includesAttraction: (item.attractions || []).map((a) => ({
                '@type': 'TouristAttraction',
                name: a.title,
                url: `${origin}/attraction/${a.slug}`,
              })),
            },
            ...(item.faq && item.faq.length
              ? [
                  {
                    '@type': 'FAQPage',
                    mainEntity: item.faq.map((f) => ({
                      '@type': 'Question',
                      name: f.question,
                      acceptedAnswer: { '@type': 'Answer', text: f.answer },
                    })),
                  },
                ]
              : []),
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

  const attractions = item.attractions || [];
  const tours = item.tours || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/destinations" className="hover:text-teal-700">
          Destinations
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{item.title}</span>
      </nav>

      <div className={`grid grid-cols-1 gap-8 ${imageUrls.length > 0 ? 'lg:grid-cols-2 lg:items-start' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
          {item.description && (
            <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">{item.description}</div>
          )}
        </div>

        {imageUrls.length > 0 && (
          <div>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
              <img src={imageUrls[0]} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
            {imageUrls.length > 1 && (
              <div className="mt-3 flex gap-3">
                {imageUrls.slice(1, 4).map((url, idx) => (
                  <div key={idx} className="aspect-square w-1/3 max-w-[9rem] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {item.visitor_information && (
        <div className="mt-10 rounded-2xl bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Visitor Information</h2>
          <div className="prose mt-3 max-w-none whitespace-pre-line text-sm text-gray-700">
            {item.visitor_information}
          </div>
        </div>
      )}

      {attractions.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Attractions</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.map((a) => (
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

      {tours.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Things To Do</h2>
          <p className="mt-1 text-sm text-gray-500">Tours you can book in and around {item.title}.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.id} tour={t} basePath="/tours" />
            ))}
          </div>
        </div>
      )}

      {item.faq && item.faq.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-4">
            <FaqAccordion items={item.faq} />
          </div>
        </div>
      )}
    </div>
  );
}
