import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import ContactForm from '../components/ContactForm';
import ConsultantCard from '../components/ConsultantCard';
import RouteMap from '../components/RouteMap';

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
  const hasDiscount = tour.original_price > 0 && tour.original_price > tour.price;
  const discountPct = hasDiscount
    ? Math.round(100 - (tour.price / tour.original_price) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/turlar" className="hover:text-teal-700">Turlar</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{tour.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* --- Galeri --- */}
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
            <span>🗓️ {tour.duration_days} gün {Math.max(tour.duration_days - 1, 0)} gece</span>
            {tour.start_date && <span>▶️ Başlangıç: {tour.start_date}</span>}
            {tour.capacity > 0 && <span>👥 Kontenjan: {tour.capacity}</span>}
          </div>

          {/* --- Tour Overview --- */}
          {tour.description && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900">Tur Hakkında</h2>
              <div className="prose mt-3 max-w-none whitespace-pre-line text-gray-700">
                {tour.description}
              </div>
            </div>
          )}

          {/* --- Rota / Harita --- */}
          {tour.route && tour.route.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">Tur Rotası</h2>
              <div className="mt-4">
                <RouteMap points={tour.route} />
              </div>
            </div>
          )}

          {/* --- Itinerary zaman çizgisi --- */}
          {tour.itinerary && tour.itinerary.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">Gün Gün Program</h2>
              <ol className="relative mt-6 space-y-8 border-l-2 border-teal-100 pl-8">
                {tour.itinerary.map((day) => (
                  <li key={day.id} className="relative">
                    <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white ring-4 ring-white">
                      {String(day.day_number).padStart(2, '0')}
                    </span>
                    <p className="text-base font-semibold text-teal-700">
                      {day.title || `${day.day_number}. Gün`}
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

          {/* --- Dahil / Hariç --- */}
          {(tour.included?.length > 0 || tour.excluded?.length > 0) && (
            <div className="mt-10 rounded-2xl bg-gray-50 p-6">
              <h2 className="text-lg font-bold text-gray-900">Dahil ve Hariç Olanlar</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Dahil</p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    {(tour.included || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 text-teal-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Hariç</p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    {(tour.excluded || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 text-red-400">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* --- Fotoğraf Galerisi --- */}
          {images.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-gray-900">Fotoğraf Galerisi</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImage(idx)}
                    className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- Sidebar --- */}
        <div className="space-y-6">
          <div className="card p-5">
            {tour.duration_days > 0 && (
              <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">Süre</span>
                <span className="font-medium text-gray-800">
                  {tour.duration_days} Gün {Math.max(tour.duration_days - 1, 0)} Gece
                </span>
              </div>
            )}
            {tour.languages?.length > 0 && (
              <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">Diller</span>
                <span className="font-medium text-gray-800">{tour.languages.join(', ')}</span>
              </div>
            )}
            {tour.highlights?.length > 0 && (
              <div className="py-2">
                <p className="mb-2 text-sm text-gray-500">Tur Öne Çıkanları</p>
                <ul className="space-y-1.5 text-sm">
                  {tour.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <span className="text-teal-600">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(tour.original_price, tour.currency)}
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  -%{discountPct}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-teal-700">
              {formatPrice(tour.price, tour.currency)}
              <span className="ml-1 text-sm font-normal text-gray-400">/ kişi</span>
            </p>
            {tour.price_note && <p className="mt-1 text-xs text-gray-500">{tour.price_note}</p>}
          </div>

          <ContactForm tourId={tour.id} tourTitle={tour.title} />

          <ConsultantCard />
        </div>
      </div>
    </div>
  );
}
