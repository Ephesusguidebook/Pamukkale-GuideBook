import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { calculateTourPrice } from '../lib/pricing';
import useSeo from '../lib/useSeo';

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0 }).format(
      amount || 0
    );
  } catch {
    return `${amount} ${currency || ''}`;
  }
}

function cheapestQuote(route, markupRates) {
  return calculateTourPrice({ tour: route, partySize: 1, selectedOptionalIds: [], role: 'customer', markupRates });
}

function maxPax(route) {
  const tiers = route.vehicle_tiers || [];
  if (!tiers.length) return 0;
  return Math.max(...tiers.map((t) => Number(t.max_people) || 0));
}

export default function Transfer() {
  useSeo('Book Your Transfer', 'Safe, comfortable, and on-time private airport and city transfers — door to door service.');

  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [markupRates, setMarkupRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/transfer-routes'),
      api.get('/transfer-routes/meta/locations'),
      api.get('/settings'),
    ])
      .then(([r1, r2, r3]) => {
        setRoutes(r1.data);
        setLocations(r2.data);
        setMarkupRates({
          agency_markup_percent: r3.data.agency_markup_percent,
          customer_markup_percent: r3.data.customer_markup_percent,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function swap() {
    setPickup(dropoff);
    setDropoff(pickup);
  }

  const filtered = routes.filter((r) => {
    if (pickup && dropoff) {
      return (
        (r.pickup_location === pickup && r.dropoff_location === dropoff) ||
        (r.pickup_location === dropoff && r.dropoff_location === pickup)
      );
    }
    if (pickup) return r.pickup_location === pickup || r.dropoff_location === pickup;
    if (dropoff) return r.pickup_location === dropoff || r.dropoff_location === dropoff;
    return true;
  });

  let filterLabel = '';
  if (pickup && dropoff) filterLabel = `Showing routes between ${pickup} and ${dropoff}`;
  else if (pickup) filterLabel = `Showing routes from: ${pickup}`;
  else if (dropoff) filterLabel = `Showing routes to: ${dropoff}`;

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-center text-white sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
          Private Airport Transfers
        </span>
        <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">Book Your Transfer</h1>
        <p className="mt-3 text-blue-100">Safe, comfortable, and on-time — door to door service</p>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="card -mt-10 relative z-10 space-y-4 p-6">
          <h2 className="font-serif text-lg font-bold text-gray-900">Select Your Route</h2>
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <div className="w-full">
              <label className="label">📍 Pick-up Location</label>
              <select className="input" value={pickup} onChange={(e) => setPickup(e.target.value)}>
                <option value="">Select pick-up...</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={swap}
              className="mb-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50"
              aria-label="Swap"
            >
              ↔
            </button>
            <div className="w-full">
              <label className="label">📍 Drop-off Location</label>
              <select className="input" value={dropoff} onChange={(e) => setDropoff(e.target.value)}>
                <option value="">Select drop-off...</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-primary w-full sm:w-auto">
              Search →
            </button>
          </div>
          {filterLabel && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <span>{filterLabel}</span>
              <button
                type="button"
                onClick={() => {
                  setPickup('');
                  setDropoff('');
                }}
                className="font-medium hover:underline"
              >
                Clear filter ✕
              </button>
            </div>
          )}
        </div>

        <div className="py-10">
          <h2 className="text-xl font-bold text-gray-900">
            All Transfer Routes <span className="text-base font-normal text-gray-400">({filtered.length} routes available)</span>
          </h2>

          {loading && <p className="mt-6 text-gray-500">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="mt-6 text-gray-500">No transfer routes match this search yet.</p>}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((r) => {
              const quote = cheapestQuote(r, markupRates);
              return (
                <Link
                  key={r.id}
                  to={`/transfer/${r.slug}`}
                  className="card flex items-center justify-between gap-4 border-l-4 border-l-blue-700 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {r.pickup_location} ↔ {r.dropoff_location}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {r.duration_text} {maxPax(r) ? `· Max ${maxPax(r)} pax` : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs uppercase text-gray-400">Starting from</p>
                    <p className="text-lg font-bold text-blue-700">{formatPrice(quote.total, r.currency)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
