import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ConsultantCard from '../components/ConsultantCard';
import { calculateTourPrice, pickVehicleTier } from '../lib/pricing';
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

export default function TransferDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [markupRates, setMarkupRates] = useState({});

  const [roundTrip, setRoundTrip] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [transferTime, setTransferTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [hotelAddress, setHotelAddress] = useState('');
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState([]);

  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [sendStatus, setSendStatus] = useState('idle'); // idle | sending | sent | error
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    Promise.all([api.get(`/transfer-routes/${slug}`), api.get('/settings')])
      .then(([r1, r2]) => {
        if (!active) return;
        setItem(r1.data);
        setMarkupRates({
          agency_markup_percent: r2.data.agency_markup_percent,
          customer_markup_percent: r2.data.customer_markup_percent,
        });
        const bestTier = pickVehicleTier(r1.data.vehicle_tiers, 1);
        setSelectedTierId(bestTier?.id ?? null);
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

  useEffect(() => {
    if (!item) return;
    api
      .get(`/transfer-routes/${slug}/availability`)
      .then((res) => setAvailabilityMap(res.data))
      .catch(() => {});
  }, [item, slug]);

  // Re-pick the recommended vehicle whenever the passenger count changes —
  // the visitor can still click a different card afterwards to override it.
  useEffect(() => {
    if (!item) return;
    const bestTier = pickVehicleTier(item.vehicle_tiers, passengers);
    setSelectedTierId(bestTier?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengers, item]);

  useSeo(item ? item.seo_title || item.title : undefined, item ? item.seo_description || item.summary : undefined);

  const selectedTier = useMemo(
    () => (item?.vehicle_tiers || []).find((t) => t.id === selectedTierId) || null,
    [item, selectedTierId]
  );

  const quote = useMemo(() => {
    if (!item || !selectedTier) return null;
    const oneWay = calculateTourPrice({
      tour: { vehicle_tiers: [selectedTier], fixed_costs: item.fixed_costs, optional_costs: item.optional_costs },
      partySize: passengers,
      selectedOptionalIds,
      role: 'customer',
      markupRates,
    });
    if (!roundTrip) return oneWay;
    return { ...oneWay, fixedWithMarkup: oneWay.fixedWithMarkup * 2, total: oneWay.fixedWithMarkup * 2 + oneWay.optionalTotal };
  }, [item, selectedTier, passengers, selectedOptionalIds, roundTrip, markupRates]);

  function toggleOptional(id) {
    setSelectedOptionalIds((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  async function handleReserve(e) {
    e.preventDefault();
    setSendStatus('sending');
    setSendError('');
    const lines = [
      `Transfer Request: ${item.pickup_location} → ${item.dropoff_location}${roundTrip ? ' (Round Trip)' : ' (One Way)'}`,
      selectedDate ? `Date: ${selectedDate}` : null,
      transferTime ? `Time: ${transferTime}` : null,
      `Passengers: ${passengers}`,
      selectedTier ? `Vehicle: ${selectedTier.vehicle_name}` : null,
      hotelAddress ? `Hotel/Address: ${hotelAddress}` : null,
      quote ? `Estimated Price: ${formatPrice(quote.total, item.currency)}` : null,
    ].filter(Boolean);
    try {
      await api.post('/contact', {
        ...contact,
        item_type: 'transfer_route',
        item_id: item.id,
        message: lines.join('\n'),
      });
      setSendStatus('sent');
    } catch (err) {
      setSendStatus('error');
      setSendError(err.response?.data?.error || 'Could not send your request, please try again.');
    }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-gray-500 sm:px-6">Loading...</div>;

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Transfer route not found</h1>
        <Link to="/transfer" className="btn-primary mt-6 inline-flex">
          All Transfer Routes
        </Link>
      </div>
    );
  }

  const tiers = item.vehicle_tiers || [];
  const optionalItems = item.optional_costs || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 border-t-4 border-t-blue-700 p-5">
        <div>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            📍 {item.pickup_location} → {item.dropoff_location}
            {item.duration_text && (
              <>
                <span className="mx-1">·</span>🕒 {item.duration_text}
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-gray-400">Starting from</p>
          <p className="text-2xl font-bold text-blue-700">{formatPrice(quote?.total, item.currency)}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">🚐 About This Transfer</h2>
          <h3 className="mt-2 text-lg font-semibold text-gray-800">{item.title}</h3>
          {item.description && <div className="prose mt-3 max-w-none whitespace-pre-line text-gray-700">{item.description}</div>}
          <Link to="/transfer" className="btn-secondary mt-6 inline-flex">
            ← All Transfer Routes
          </Link>
        </div>

        {/* --- Booking widget --- */}
        <div className="space-y-4">
          <div className="card overflow-hidden p-0">
            <div className="bg-blue-800 px-5 py-4 text-center text-white">
              <p className="text-xs uppercase text-blue-100">Starting from</p>
              <p className="text-3xl font-bold">{formatPrice(quote?.total, item.currency)}</p>
              <p className="text-xs text-blue-100">per vehicle · private transfer</p>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoundTrip(false)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    !roundTrip ? 'bg-blue-700 text-white' : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  → One Way
                </button>
                <button
                  type="button"
                  onClick={() => setRoundTrip(true)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    roundTrip ? 'bg-blue-700 text-white' : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  ⇄ Round Trip
                </button>
              </div>

              <AvailabilityCalendar
                mode="public"
                availabilityMap={availabilityMap}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />

              <div>
                <label className="label">Transfer Time</label>
                <input type="time" className="input" value={transferTime} onChange={(e) => setTransferTime(e.target.value)} />
              </div>

              <div>
                <label className="label">👥 Passengers</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-800">{passengers}</span>
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => p + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Hotel / Address</label>
                <input
                  className="input"
                  placeholder="e.g. Hilton Kusadasi..."
                  value={hotelAddress}
                  onChange={(e) => setHotelAddress(e.target.value)}
                />
              </div>

              {tiers.length > 0 && (
                <div>
                  <label className="label">🚐 Select Vehicle</label>
                  <div className="space-y-2">
                    {tiers.map((t) => {
                      const tierQuote = calculateTourPrice({
                        tour: { vehicle_tiers: [t], fixed_costs: item.fixed_costs, optional_costs: [] },
                        partySize: passengers,
                        selectedOptionalIds: [],
                        role: 'customer',
                        markupRates,
                      });
                      const price = roundTrip ? tierQuote.total * 2 : tierQuote.total;
                      const active = selectedTierId === t.id;
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setSelectedTierId(t.id)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                            active ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          <span>
                            <span className="block text-sm font-semibold text-gray-800">{t.vehicle_name}</span>
                            <span className="block text-xs text-gray-500">
                              {t.min_people}-{t.max_people ?? '∞'} pax
                              {t.luggage ? ` · ${t.luggage} luggage` : ''}
                            </span>
                          </span>
                          <span className="font-bold text-blue-700">{formatPrice(price, item.currency)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {optionalItems.length > 0 && (
                <div>
                  <label className="label">Extras</label>
                  <div className="space-y-1">
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
                        <span className="text-gray-500">{formatPrice(c.cost_per_person, item.currency)}/pax</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-xs uppercase text-blue-700">Estimated Price</p>
                <p className="text-2xl font-bold text-blue-800">{formatPrice(quote?.total, item.currency)}</p>
              </div>
            </div>
          </div>

          {/* --- Reservation request (no online payment yet — sent as an enquiry) --- */}
          {sendStatus === 'sent' ? (
            <div className="card p-6 text-center">
              <p className="text-lg font-semibold text-teal-700">Request received!</p>
              <p className="mt-1 text-sm text-gray-500">We'll get back to you shortly to confirm your transfer.</p>
            </div>
          ) : (
            <form onSubmit={handleReserve} className="card space-y-3 p-5">
              <h3 className="font-semibold text-gray-800">Request This Transfer</h3>
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  required
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
                </div>
              </div>
              {sendStatus === 'error' && <p className="text-sm text-red-600">{sendError}</p>}
              <button type="submit" className="btn-primary w-full" disabled={sendStatus === 'sending'}>
                {sendStatus === 'sending' ? 'Sending...' : 'Send Reservation Request'}
              </button>
            </form>
          )}

          <ConsultantCard />
        </div>
      </div>
    </div>
  );
}
