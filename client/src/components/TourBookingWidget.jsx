import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import AvailabilityCalendar from './AvailabilityCalendar';
import { calculateTourPrice, calculateSmallGroupPrice, pickVehicleTier } from '../lib/pricing';
import { TYPE_TO_CONTACT_ITEM_TYPE } from '../lib/tourRouting';

// Faz 3 — 3-step public booking wizard for a Tour (Private or Small Group),
// replacing the old static price-card + ContactForm sidebar block. Mirrors
// TransferDetail's data-fetching/pricing shape but as its own multi-step UI
// matching the reference design: Step 1 pick a date + guest count against
// the tour's availability calendar, Step 2 customise with optional add-ons
// and see a live price breakdown, Step 3 leave contact + pick-up details.
// Like Transfer, there's no real payment/booking backend yet (Faz 4) — this
// still submits as a composed enquiry via POST /api/contact, landing in
// Admin > Messages.

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${amount} ${currency || ''}`;
  }
}

const STEP_LABELS = { 1: 'Select Date & Guests', 2: 'Customise Your Tour', 3: 'Complete Your Booking' };

export default function TourBookingWidget({ item }) {
  const isSmallGroup = item.booking_type === 'small_group';

  const [step, setStep] = useState(1);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [markupRates, setMarkupRates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [sendStatus, setSendStatus] = useState('idle'); // idle | sending | sent | error
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get(`/tours/${item.slug}/availability`)
      .then((res) => {
        if (active) setAvailabilityMap(res.data);
      })
      .catch(() => {});
    if (!isSmallGroup) {
      api
        .get('/settings')
        .then((res) => {
          if (active) {
            setMarkupRates({
              agency_markup_percent: res.data.agency_markup_percent,
              customer_markup_percent: res.data.customer_markup_percent,
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [item.slug, isSmallGroup]);

  const vehicleTier = useMemo(
    () => (isSmallGroup ? null : pickVehicleTier(item.vehicle_tiers, guests)),
    [isSmallGroup, item.vehicle_tiers, guests]
  );

  const quote = useMemo(() => {
    if (isSmallGroup) {
      return calculateSmallGroupPrice({
        tour: { price: item.price, optional_costs: item.optional_costs },
        partySize: guests,
        selectedOptionalIds,
      });
    }
    return calculateTourPrice({
      tour: { vehicle_tiers: vehicleTier ? [vehicleTier] : [], fixed_costs: item.fixed_costs, optional_costs: item.optional_costs },
      partySize: guests,
      selectedOptionalIds,
      role: 'customer',
      markupRates,
    });
  }, [isSmallGroup, item.price, item.fixed_costs, item.optional_costs, vehicleTier, guests, selectedOptionalIds, markupRates]);

  const selectedStatus = selectedDate ? availabilityMap[selectedDate] || 'available' : null;
  const optionalItems = item.optional_costs || [];

  function toggleOptional(id) {
    setSelectedOptionalIds((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSendStatus('sending');
    setSendError('');
    const lines = [
      `Tour Booking Request: ${item.title} (${isSmallGroup ? 'Small Group' : 'Private'})`,
      selectedDate ? `Date: ${selectedDate}${selectedStatus === 'on_request' ? ' (On Request)' : ''}` : null,
      `Guests: ${guests}`,
      vehicleTier ? `Vehicle: ${vehicleTier.vehicle_name}` : null,
      quote.selectedOptionalItems.length > 0
        ? `Add-ons: ${quote.selectedOptionalItems.map((c) => c.name).join(', ')}`
        : null,
      pickupLocation ? `Pick-up Location: ${pickupLocation}` : null,
      `Estimated Price: ${formatPrice(quote.total, item.currency)}`,
      specialRequests ? `Special Requests: ${specialRequests}` : null,
    ].filter(Boolean);
    try {
      await api.post('/contact', {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        item_type: TYPE_TO_CONTACT_ITEM_TYPE[item.type],
        item_id: item.id,
        message: lines.join('\n'),
      });
      setSendStatus('sent');
    } catch (err) {
      setSendStatus('error');
      setSendError(err.response?.data?.error || 'Could not send your request, please try again.');
    }
  }

  if (sendStatus === 'sent') {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-teal-700">Request received!</p>
        <p className="mt-1 text-sm text-gray-500">We'll get back to you shortly to confirm your booking.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="bg-teal-800 px-5 py-4 text-white">
        <p className="text-xs uppercase tracking-wide text-teal-100">
          Step {step} of 3 — {STEP_LABELS[step]}
        </p>
        <p className="mt-1 text-2xl font-bold">{formatPrice(quote.total, item.currency)}</p>
        <p className="text-xs text-teal-100">
          {isSmallGroup ? 'per person · guaranteed departure' : 'estimated total · private tour'}
        </p>
        {item.price_note && <p className="mt-1 text-xs text-teal-100/80">{item.price_note}</p>}
      </div>

      <div className="space-y-4 p-5">
        {/* --- Step 1: date + guests --- */}
        {step === 1 && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Select Date &amp; Guests</p>
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
                {selectedStatus === 'on_request' ? `⏳ ${selectedDate} — On Request` : `✓ ${selectedDate} — Available!`}
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
            <button
              type="button"
              disabled={!selectedDate}
              onClick={() => setStep(2)}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check Availability →
            </button>
          </>
        )}

        {/* --- Step 2: customise + live price breakdown --- */}
        {step === 2 && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Customise Your Tour</p>

            <div className="rounded-lg border border-gray-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">What's Included</p>
              <div className="space-y-1 text-sm">
                {isSmallGroup
                  ? (item.included || []).length > 0
                    ? item.included.map((label, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-gray-700">{label}</span>
                          <span className="font-medium text-emerald-600">✓ Included</span>
                        </div>
                      ))
                    : <p className="text-gray-400">—</p>
                  : (
                      <>
                        {(item.fixed_costs || []).map((c) => (
                          <div key={c.id} className="flex items-center justify-between">
                            <span className="text-gray-700">{c.name}</span>
                            <span className="font-medium text-emerald-600">✓ Included</span>
                          </div>
                        ))}
                        {vehicleTier && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Vehicle ({vehicleTier.vehicle_name})</span>
                            <span className="font-medium text-emerald-600">✓ Included</span>
                          </div>
                        )}
                      </>
                    )}
              </div>
            </div>

            {optionalItems.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Optional Add-ons (per person)</p>
                <div className="space-y-2">
                  {optionalItems.map((c) => (
                    <label key={c.id} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedOptionalIds.includes(c.id)}
                          onChange={() => toggleOptional(c.id)}
                        />
                        {c.name}
                      </span>
                      <span className="text-gray-500">{formatPrice(c.cost_per_person, item.currency)}pp</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-teal-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-teal-700">Price Breakdown</p>
              <div className="space-y-1 text-sm text-gray-700">
                {isSmallGroup ? (
                  <div className="flex justify-between">
                    <span>
                      {formatPrice(quote.pricePerPerson, item.currency)} × {guests}
                    </span>
                    <span>{formatPrice(quote.baseTotal, item.currency)}</span>
                  </div>
                ) : (
                  <>
                    {(item.fixed_costs || []).map((c) => (
                      <div key={c.id} className="flex justify-between">
                        <span>{c.name}</span>
                        <span>✓ Incl</span>
                      </div>
                    ))}
                    {vehicleTier && (
                      <div className="flex justify-between">
                        <span>{vehicleTier.vehicle_name}</span>
                        <span>✓ Incl</span>
                      </div>
                    )}
                  </>
                )}
                {quote.selectedOptionalItems.map((c) => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.name}</span>
                    <span>{formatPrice(c.line_total, item.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-teal-200 pt-2 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(quote.total, item.currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                ← Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                Continue to Booking →
              </button>
            </div>
          </>
        )}

        {/* --- Step 3: contact details --- */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Complete Your Booking</p>

            <div className="space-y-1 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
              <div>
                <span className="text-gray-500">Tour</span>
                <p className="font-medium text-gray-900">{item.title}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{selectedDate || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Guests</span>
                <span className="font-medium">{guests}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(quote.total, item.currency)}</span>
              </div>
            </div>

            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              No payment required now — we'll contact you to confirm availability and arrange payment.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">First Name</label>
                <input className="input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Pick-up Location</label>
              <input
                className="input"
                placeholder="e.g. Hotel name, Cruise Port..."
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Special Requests</label>
              <textarea
                className="input"
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            {sendStatus === 'error' && <p className="text-sm text-red-600">{sendError}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1" disabled={sendStatus === 'sending'}>
                ← Back
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={sendStatus === 'sending'}>
                {sendStatus === 'sending' ? 'Sending...' : 'Send Booking Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
