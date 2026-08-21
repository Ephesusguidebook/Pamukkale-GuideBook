import { useEffect, useState } from 'react';
import agencyApi from '../../agencyApi';
import AgencyBookingRequestModal from '../../components/AgencyBookingRequestModal';
import { calculateTourPrice, calculateSmallGroupPrice, pickVehicleTier } from '../../lib/pricing';
import { TOUR_TYPE_BY_VALUE } from '../../lib/tourRouting';

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${amount} ${currency || ''}`;
  }
}

function agencyStartingPrice(tour, markupPercent) {
  if (tour.booking_type === 'small_group') {
    return calculateSmallGroupPrice({ tour: { price: tour.price }, partySize: 1 }).total;
  }
  const vehicleTier = pickVehicleTier(tour.vehicle_tiers, 1);
  return calculateTourPrice({
    tour: { vehicle_tiers: vehicleTier ? [vehicleTier] : [], fixed_costs: tour.fixed_costs },
    partySize: 1,
    role: 'agency',
    markupRates: { agency_markup_percent: markupPercent },
  }).total;
}

// Faz — Agency Portal. "Give the agency the full list of every tour on the
// site, in list form" — a plain table rather than the public site's card
// grid, showing each tour's net agency-rate starting price (role: 'agency'
// in the shared pricing engine, using this agency's own markup override
// when set) so they can see real numbers before requesting a booking.
export default function AgencyTours() {
  const [tours, setTours] = useState([]);
  const [markupPercent, setMarkupPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeTour, setActiveTour] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([agencyApi.get('/tours'), agencyApi.get('/agency/auth/me')])
      .then(([toursRes, meRes]) => {
        if (!active) return;
        setTours(toursRes.data);
        setMarkupPercent(Number(meRes.data.effective_markup_percent) || 0);
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

  const filtered = tours.filter((t) =>
    `${t.title} ${t.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tours</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your agency rate ({markupPercent}% markup) — starting price for 1 guest, request a booking for the exact date and party size.
          </p>
        </div>
        <input
          className="input sm:w-72"
          placeholder="Search tours or a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="text-gray-500">No tours published yet.</p>}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Agency Rate (from)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{tour.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {TOUR_TYPE_BY_VALUE[tour.type]?.label || tour.type}
                    {tour.booking_type === 'small_group' && (
                      <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Small Group
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tour.location || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {tour.duration_days} {tour.duration_days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-700">
                    {formatPrice(agencyStartingPrice(tour, markupPercent), tour.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTour(tour)}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      Request Booking
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTour && (
        <AgencyBookingRequestModal
          tour={activeTour}
          markupPercent={markupPercent}
          onClose={() => setActiveTour(null)}
          onSubmitted={() => {}}
        />
      )}
    </div>
  );
}
