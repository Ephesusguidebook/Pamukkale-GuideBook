const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

// Full admin-side management for the Agency (B2B) portal: agency accounts
// themselves, the bookings made against them, each booking's passenger /
// passport registry, and the "Ön Muhasebe" ledger. Kept as one router
// (rather than following the entryRoutes.adminRouter factory, which assumes
// a slugged content type) since every sub-resource here is scoped under a
// specific agency id.

const router = express.Router();
router.use(requireAdmin);

async function logAction(req, action, entityType, label) {
  await db.adminLogs.create({ admin_email: req.admin?.email, action, entity_type: entityType, entity_label: label });
}

async function loadAgencyOr404(req, res) {
  const agency = await db.agencies.getById(req.params.id);
  if (!agency) {
    res.status(404).json({ error: 'Agency not found.' });
    return null;
  }
  return agency;
}

async function loadBookingOr404(req, res) {
  const booking = await db.agencyBookings.getById(req.params.bookingId);
  if (!booking || Number(booking.agency_id) !== Number(req.params.id)) {
    res.status(404).json({ error: 'Booking not found.' });
    return null;
  }
  return booking;
}

// --- Agencies ---

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const agencies = await db.agencies.listAll();
    const withStats = await Promise.all(
      agencies.map(async (a) => {
        const bookings = await db.agencyBookings.listByAgency(a.id);
        const pending_bookings = bookings.filter((b) => b.status === 'pending').length;
        const balance = await db.agencyLedger.balanceForAgency(a.id);
        return { ...a, pending_bookings, booking_count: bookings.length, balance };
      })
    );
    res.json(withStats);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (await db.agencies.emailExists(email)) {
      return res.status(400).json({ error: 'An agency with that email already exists.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const agency = await db.agencies.create(req.body);
    await logAction(req, 'create', 'agency', agency.company_name || agency.email);
    res.status(201).json(agency);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const balance = await db.agencyLedger.balanceForAgency(agency.id);
    res.json({ ...agency, balance });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    if (req.body?.email && (await db.agencies.emailExists(req.body.email, agency.id))) {
      return res.status(400).json({ error: 'An agency with that email already exists.' });
    }
    if (req.body?.password && String(req.body.password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const updated = await db.agencies.update(agency.id, req.body || {});
    await logAction(req, 'update', 'agency', updated.company_name || updated.email);
    res.json(updated);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    await db.agencies.remove(agency.id);
    await logAction(req, 'delete', 'agency', agency.company_name || agency.email);
    res.json({ ok: true });
  })
);

// --- Bookings (admin view/management) ---

router.get(
  '/:id/bookings',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const bookings = await db.agencyBookings.listByAgency(agency.id);
    const withCounts = await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        passenger_count: (await db.agencyBookingPassengers.listByBooking(b.id)).length,
      }))
    );
    res.json(withCounts);
  })
);

// Admin can log a booking made outside the portal (phone/email) directly
// against an agency, already confirmed if a price is given.
router.post(
  '/:id/bookings',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await db.agencyBookings.create({
      ...req.body,
      agency_id: agency.id,
      agency_company_name: agency.company_name,
    });
    await logAction(req, 'create', 'agency_booking', `${agency.company_name} — ${booking.tour_title}`);
    res.status(201).json(booking);
  })
);

router.get(
  '/:id/bookings/:bookingId',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    const passengers = await db.agencyBookingPassengers.listByBooking(booking.id);
    res.json({ ...booking, passengers });
  })
);

// Update status/price/notes. Pass add_ledger_charge: true to also drop a
// matching 'charge' entry into the agency's ledger for total_price — the
// normal move when confirming a booking with its final price.
router.put(
  '/:id/bookings/:bookingId',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    const updated = await db.agencyBookings.update(booking.id, req.body || {});
    if (req.body?.add_ledger_charge) {
      await db.agencyLedger.create({
        agency_id: agency.id,
        booking_id: updated.id,
        entry_date: new Date().toISOString().slice(0, 10),
        type: 'charge',
        description: `${updated.tour_title} — ${updated.travel_date || 'date TBC'} — ${updated.pax_count} pax`,
        amount: updated.total_price,
        currency: updated.currency,
        created_by: req.admin?.email || '',
      });
    }
    await logAction(req, 'update', 'agency_booking', `${agency.company_name} — ${updated.tour_title}`);
    res.json(updated);
  })
);

router.delete(
  '/:id/bookings/:bookingId',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    await db.agencyBookings.remove(booking.id);
    await logAction(req, 'delete', 'agency_booking', `${agency.company_name} — ${booking.tour_title}`);
    res.json({ ok: true });
  })
);

// --- Passenger / passport registry (admin can manage too, for oversight) ---

router.get(
  '/:id/bookings/:bookingId/passengers',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    res.json(await db.agencyBookingPassengers.listByBooking(booking.id));
  })
);

router.post(
  '/:id/bookings/:bookingId/passengers',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    const passenger = await db.agencyBookingPassengers.create(booking.id, req.body || {});
    res.status(201).json(passenger);
  })
);

router.put(
  '/:id/bookings/:bookingId/passengers/:passengerId',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    const passenger = await db.agencyBookingPassengers.getById(req.params.passengerId);
    if (!passenger || Number(passenger.booking_id) !== Number(booking.id)) {
      return res.status(404).json({ error: 'Passenger not found.' });
    }
    res.json(await db.agencyBookingPassengers.update(passenger.id, req.body || {}));
  })
);

router.delete(
  '/:id/bookings/:bookingId/passengers/:passengerId',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const booking = await loadBookingOr404(req, res);
    if (!booking) return;
    const passenger = await db.agencyBookingPassengers.getById(req.params.passengerId);
    if (!passenger || Number(passenger.booking_id) !== Number(booking.id)) {
      return res.status(404).json({ error: 'Passenger not found.' });
    }
    await db.agencyBookingPassengers.remove(passenger.id);
    res.json({ ok: true });
  })
);

// --- Ledger ("Ön Muhasebe") ---

router.get(
  '/:id/ledger',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const entries = await db.agencyLedger.listByAgency(agency.id);
    const balance = await db.agencyLedger.balanceForAgency(agency.id);
    res.json({ entries, balance });
  })
);

router.post(
  '/:id/ledger',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const entry = await db.agencyLedger.create({
      ...req.body,
      agency_id: agency.id,
      created_by: req.admin?.email || '',
    });
    await logAction(req, 'create', 'agency_ledger', `${agency.company_name} — ${entry.type} ${entry.amount}`);
    res.status(201).json(entry);
  })
);

router.delete(
  '/:id/ledger/:entryId',
  asyncHandler(async (req, res) => {
    const agency = await loadAgencyOr404(req, res);
    if (!agency) return;
    const entry = await db.agencyLedger.getById(req.params.entryId);
    if (!entry || Number(entry.agency_id) !== Number(agency.id)) {
      return res.status(404).json({ error: 'Ledger entry not found.' });
    }
    await db.agencyLedger.remove(entry.id);
    await logAction(req, 'delete', 'agency_ledger', `${agency.company_name} — ${entry.type} ${entry.amount}`);
    res.json({ ok: true });
  })
);

module.exports = router;
