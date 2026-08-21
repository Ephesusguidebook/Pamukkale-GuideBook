const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// The client needs the exact slug the server would compute for a tour's
// departure_point (to link to /tours/from-:slug) without re-implementing
// slugify's Turkish-character handling itself — so every tour response
// carries it precomputed.
function withDepartureSlug(tour) {
  return { ...tour, departure_slug: tour.departure_point ? db.departureSlug(tour.departure_point) : '' };
}

// GET /api/tours/meta/departures - distinct departure points among
// published tours, used to build the departure filter chips on the /tours
// listing page. Registered before /:slug so "meta" is never mistaken for a
// tour's slug (though as a two-segment path it wouldn't collide anyway).
router.get(
  '/meta/departures',
  asyncHandler(async (req, res) => {
    res.json(await db.tours.distinctDeparturePoints());
  })
);

// GET /api/tours?type=daily&departure=kusadasi - supports the combinable
// type + departure-point filters behind /tours, /tours/:type,
// /tours/from-:departure and /tours/:type/from-:departure.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const type = db.TOUR_TYPES.includes(req.query.type) ? req.query.type : undefined;
    const departure = req.query.departure ? String(req.query.departure).toLowerCase() : undefined;
    const items = await db.tours.listPublishedByFilter({ type, departureSlug: departure });
    res.json(items.map(withDepartureSlug));
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await db.tours.getPublishedBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Tour not found.' });
    res.json(withDepartureSlug(item));
  })
);

module.exports = router;
