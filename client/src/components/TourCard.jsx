import { Link } from 'react-router-dom';

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

export default function TourCard({ tour, basePath }) {
  const cover =
    tour.cover_image || (tour.images && tour.images[0] && tour.images[0].url) || '';

  return (
    <Link
      to={`${basePath}/${tour.slug}`}
      className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={tour.title}
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
        {tour.location && (
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
            {tour.location}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900">
          {tour.title}
        </h3>
        {tour.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{tour.summary}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {tour.duration_days} {tour.duration_days === 1 ? 'day' : 'days'}
          </span>
          <span className="text-lg font-bold text-teal-700">
            {formatPrice(tour.price, tour.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}
