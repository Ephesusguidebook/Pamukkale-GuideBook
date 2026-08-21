const express = require('express');
const db = require('../db');
const { requireAgency } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

// Everything below belongs to the logged-in agency's own account only — the
// site's tour catalogue itself is already public (GET /api/tours,
// /api/tours/:slug, /api/tours/:slug/availability, /api/settings), so the
// agency portal's Tours page reuses those directly instead of duplicating
// them here. This router only covers what's specific to an agency: booking
// requests, the passenger/passport registry on each booking, and the
// read-only "Ön Muhasebe" ledger.

const router = express.Router();
router.use(requireAgency);

async function loadOwnBooking(req, res) {
  const booking = await db.agencyBookings.getById(req.params.bookingId || req.params.id);
  if (!booking || Number(booking.agency_id) !== Number(req.agency.sub)) {
    res.status(404).json({ error: 'Booking not found.' });
    return null;
  }
  return booking;
}

// GET /api/agency/bookings - this agency's own booking requests.
router.get(
  '/bookings',
  asyncHandler(async (req, res) => {
    const bookings = await db.agencyBookings.listByAgency(req.agency.sub);
    const withCounts = await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        passenger_count: (await db.agencyBookingPassengers.listByBooking(b.id)).length,
      }))
    );
    res.json(withCounts);
  })
);

// POST /api/agency/bookings - request a booking for a published tour.
// { tour_id, travel_date, pax_count, notes } -> status starts 'pending';
// the admin reviews it, sets a final total_price and confirms.
router.post(
  '/bookings',
  asyncHandler(async (req, res) => {
    const { tour_id, travel_date, pax_count, notes } = req.body || {};
    const tour = tour_id ? await db.tours.getById(tour_id) : null;
    if (!tour || tour.status !== 'published') {
      return res.status(400).json({ error: 'That tour is not available for booking.' });
    }
    const agency = await db.agencies.getById(req.agency.sub);
    const pax = Math.max(1, Number(pax_count) || 1);
    const estimate = await db.agencyBookings.estimatePrice(tour, agency, pax);
    const booking = await db.agencyBookings.create({
      agency_id: agency.id,
      agency_company_name: agency.company_name,
      tour_id: tour.id,
      tour_title: tour.title,
      travel_date: travel_date || '',
      pax_count: pax,
      total_price: estimate.total,
      currency: estimate.currency,
      status: 'pending',
      notes: notes || '',
    });
    res.status(201).json(booking);
  })
);

// GET /api/agency/bookings/:id - single booking (own only) + its passengers.
router.get(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    const passengers = await db.agencyBookingPassengers.listByBooking(booking.id);
    res.json({ ...booking, passengers });
  })
);

// --- Passenger / passport registry ---
router.get(
  '/bookings/:bookingId/passengers',
  asyncHandler(async (req, res) => {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    res.json(await db.agencyBookingPassengers.listByBooking(booking.id));
  })
);

router.post(
  '/bookings/:bookingId/passengers',
  asyncHandler(async (req, res) => {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    const passenger = await db.agencyBookingPassengers.create(booking.id, req.body || {});
    res.status(201).json(passenger);
  })
);

router.put(
  '/bookings/:bookingId/passengers/:passengerId',
  asyncHandler(async (req, res) => {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    const passenger = await db.agencyBookingPassengers.getById(req.params.passengerId);
    if (!passenger || Number(passenger.booking_id) !== Number(booking.id)) {
      return res.status(404).json({ error: 'Passenger not found.' });
    }
    const updated = await db.agencyBookingPassengers.update(passenger.id, req.body || {});
    res.json(updated);
  })
);

router.delete(
  '/bookings/:bookingId/passengers/:passengerId',
  asyncHandler(async (req, res) => {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    const passenger = await db.agencyBookingPassengers.getById(req.params.passengerId);
    if (!passenger || Number(passenger.booking_id) !== Number(booking.id)) {
      return res.status(404).json({ error: 'Passenger not found.' });
    }
    await db.agencyBookingPassengers.remove(passenger.id);
    res.json({ ok: true });
  })
);

// GET /api/agency/ledger - read-only "Ön Muhasebe" statement + balance.
router.get(
  '/ledger',
  asyncHandler(async (req, res) => {
    const entries = await db.agencyLedger.listByAgency(req.agency.sub);
    const balance = await db.agencyLedger.balanceForAgency(req.agency.sub);
    res.json({ entries, balance });
  })
);

module.exports = router;
