import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TourCard from '../components/TourCard';
import { CATEGORIES } from '../lib/categories';

function CategorySection({ category, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{category.heading}</h2>
        <Link
          to={category.publicPath}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <TourCard key={item.id} tour={item} basePath={category.publicPath} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [packageTours, setPackageTours] = useState([]);
  const [dailyTours, setDailyTours] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/package-tours'),
      api.get('/daily-tours'),
      api.get('/activities'),
    ])
      .then(([pkg, daily, act]) => {
        if (!active) return;
        setPackageTours(pkg.data);
        setDailyTours(daily.data);
        setActivities(act.data);
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

  const nothingPublished =
    !loading && !error && packageTours.length === 0 && dailyTours.length === 0 && activities.length === 0;

  return (
    <div>
      <section className="bg-gradient-to-b from-teal-700 to-teal-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-200">
            Unforgettable Journeys
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
            Find your dream tour and hit the road
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-teal-100">
            Explore our carefully curated package tours, daily tours and activities.
            Detailed itineraries, transparent pricing and easy communication.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={CATEGORIES.packageTours.publicPath}
              className="btn-primary bg-amber-500 hover:bg-amber-600"
            >
              Explore Package Tours
            </Link>
            <Link
              to={CATEGORIES.dailyTours.publicPath}
              className="btn-secondary !bg-white/10 !text-white hover:!bg-white/20"
            >
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

      <CategorySection category={CATEGORIES.packageTours} items={packageTours} />
      <CategorySection category={CATEGORIES.dailyTours} items={dailyTours} />
      <CategorySection category={CATEGORIES.activities} items={activities} />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl bg-gray-50 p-8 text-center sm:p-12">
          <h2 className="text-xl font-bold text-gray-900">From the Blog</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Travel tips, destination guides and stories to help you plan your trip.
          </p>
          <Link to="/blog" className="btn-primary mt-6 inline-flex">
            Visit the Blog
          </Link>
        </div>
      </section>
    </div>
  );
}
