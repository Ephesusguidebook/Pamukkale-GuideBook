import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import ContactForm from '../components/ContactForm';

function formatPrice(price, currency) {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      maximumFractionDigits: 0,
    }).format(price || 0);
  } catch {
    return `${price} ${currency || ''}`;
  }
}

export default function TourDetail() {
  const { slug } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/tours/${slug}`)
      .then((res) => {
        if (active) {
          setTour(res.data);
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

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-gray-500 sm:px-6">Yükleniyor...</div>;
  }

  if (notFound || !tour) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Tur bulunamadı</h1>
        <p className="mt-2 text-gray-500">Bu tur kaldırılmış ya da yayında olmayabilir.</p>
        <Link to="/turlar" className="btn-primary mt-6 inline-flex">
          Turlara dön
        </Link>
      </div>
    );
  }

  const images = tour.images && tour.images.length ? tour.images : (tour.cover_image ? [{ url: tour.cover_image }] : []);
  const mainImage = images[activeImage]?.url || tour.cover_image;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/turlar" className="hover:text-teal-700">Turlar</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{tour.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
            {mainImage ? (
              <img src={mainImage} alt={tour.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">Görsel yok</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === activeImage ? 'border-teal-700' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="mt-8 text-3xl font-bold text-gray-900">{tour.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
            {tour.location && <span>📍 {tour.location}</span>}
            <span>🗓️ {tour.duration_days} gün</span>
            {tour.start_date && <span>▶️ Başlangıç: {tour.start_date}</span>}
            {tour.capacity > 0 && <span>👥 Kontenjan: {tour.capacity}</span>}
          </div>

          {tour.description && (
            <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">
              {tour.description}
            </div>
          )}

          {tour.itinerary && tour.itinerary.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">Gün Gün Program</h2>
              <ol className="mt-4 space-y-4">
                {tour.itinerary.map((day) => (
                  <li key={day.id} className="card p-4">
                    <p className="text-sm font-semibold text-amber-600">
                      {day.day_number}. Gün{day.title ? ` — ${day.title}` : ''}
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
        </div>

        <div>
          <div className="card sticky top-24 mb-6 p-6 text-center">
            <p className="text-sm text-gray-500">Kişi başı fiyat</p>
            <p className="text-3xl font-bold text-teal-700">
              {formatPrice(tour.price, tour.currency)}
            </p>
          </div>
          <ContactForm tourId={tour.id} tourTitle={tour.title} />
        </div>
      </div>
    </div>
  );
}
