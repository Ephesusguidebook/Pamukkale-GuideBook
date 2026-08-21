import { useEffect, useMemo, useState } from 'react';
import agencyApi from '../agencyApi';
import AvailabilityCalendar from './AvailabilityCalendar';
import { calculateTourPrice, calculateSmallGroupPrice, pickVehicleTier } from '../lib/pricing';

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${amount} ${currency || ''}`;
  }
}

// Agency portal's booking-request flow — a condensed one-step version of
// the public TourBookingWidget (date + guests, live agency-rate price, a
// notes field) submitting to POST /api/agency/bookings instead of
// /api/contact. No optional add-ons here on purpose: this only produces a
// starting estimate the admin reviews and finalises when confirming, so the
// agency can simply note any extras they need instead of pricing them here.
export default function AgencyBookingRequestModal({ tour, markupPercent, onClose, onSubmitted }) {
  const isSmallGroup = tour.booking_type === 'small_group';

  const [availabilityMap, setAvailabilityMap] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    agencyApi
      .get(`/tours/${tour.slug}/availability`)
      .then((res) => {
        if (active) setAvailabilityMap(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tour.slug]);

  const vehicleTier = useMemo(
    () => (isSmallGroup ? null : pickVehicleTier(tour.vehicle_tiers, guests)),
    [isSmallGroup, tour.vehicle_tiers, guests]
  );

  const quote = useMemo(() => {
    if (isSmallGroup) {
      return calculateSmallGroupPrice({ tour: { price: tour.price }, partySize: guests });
    }
    return calculateTourPrice({
      tour: { vehicle_tiers: vehicleTier ? [vehicleTier] : [], fixed_costs: tour.fixed_costs },
      partySize: guests,
      role: 'agency',
      markupRates: { agency_markup_percent: markupPercent },
    });
  }, [isSmallGroup, tour.price, tour.fixed_costs, vehicleTier, guests, markupPercent]);

  const selectedStatus = selectedDate ? availabilityMap[selectedDate] || 'available' : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await agencyApi.post('/agency/bookings', {
        tour_id: tour.id,
        travel_date: selectedDate,
        pax_count: guests,
        notes,
      });
      setStatus('sent');
      onSubmitted?.();
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Could not send the booking request, please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b border-gray-100 bg-blue-800 px-5 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">Request Booking</p>
            <p className="text-lg font-bold">{tour.title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-blue-100 hover:text-white">
            ×
          </button>
        </div>

        {status === 'sent' ? (
          <div className="p-6 text-center">
            <p className="text-lg font-semibold text-blue-700">Request sent!</p>
            <p className="mt-1 text-sm text-gray-500">
              You'll see it under My Bookings — we'll confirm the final price and availability shortly.
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-6">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <AvailabilityCalendar
              mode="public"
              availabilityMap={availabilityMap}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            {selectedDate && (
              <p
                className={`rounded-lg p-3 text-sm font-medium ${
                  selectedStatus === 'on_request' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {selectedStatus === 'on_request' ? `⏳ ${selectedDate} — On Request` : `✓ ${selectedDate} — Available`}
              </p>
            )}

            <div>
              <label className="label">👥 Number of Guests</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-gray-800">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => g + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-800">Estimated Agency Rate</span>
                <span className="text-xl font-bold text-blue-800">{formatPrice(quote.total, tour.currency)}</span>
              </div>
              <p className="mt-1 text-xs text-blue-700">
                {isSmallGroup
                  ? 'Flat guaranteed-departure price — no markup.'
                  : `Includes your ${markupPercent}% agency rate. Final price confirmed by our team.`}
              </p>
            </div>

            <div>
              <label className="label">Notes (extras, pick-up details, special requests...)</label>
              <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={!selectedDate || status === 'sending'}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending...' : 'Send Booking Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
