import { Link } from 'react-router-dom';
import ContactForm from '../components/ContactForm';
import { TOUR_TYPES } from '../lib/tourRouting';
import useSeo from '../lib/useSeo';

export default function NotFound() {
  useSeo('Page Not Found', "The page you're looking for could not be found.");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-500">
          The page you're looking for could not be found. It may have been moved, renamed, or
          no longer exists.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to homepage
        </Link>
      </div>

      <div className="mt-14">
        <h2 className="text-center text-lg font-semibold text-gray-900">
          Still looking for something?
        </h2>
        <p className="mx-auto mt-1 max-w-md text-center text-sm text-gray-500">
          Tell us what you were trying to find and we'll help you out.
        </p>
        <div className="card mx-auto mt-6 max-w-md p-6">
          <ContactForm />
        </div>
      </div>

      <div className="mt-14">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
          Or explore what we offer
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TOUR_TYPES.map((type) => (
            <Link
              key={type.value}
              to={`/tours/${type.urlSlug}`}
              className="card p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="font-semibold text-gray-900">{type.pluralLabel}</p>
              <p className="mt-1 text-sm text-gray-500">{type.intro}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
