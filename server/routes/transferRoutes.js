const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');
const { attachPublicAvailability } = require('../lib/availabilityRoutes');

const router = express.Router();

// GET /api/transfer-routes/meta/locations - distinct pickup/dropoff location
// names among published routes, used to build the search dropdowns on the
// /transfer page. Registered before /:slug so "meta" is never mistaken for
// a route's slug.
router.get(
  '/meta/locations',
  asyncHandler(async (req, res) => {
    res.json(await db.transferRoutes.distinctLocations());
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await db.transferRoutes.listPublished());
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await db.transferRoutes.getPublishedBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Transfer route not found.' });
    res.json(item);
  })
);

// GET /api/transfer-routes/:slug/availability?from=YYYY-MM-DD&to=YYYY-MM-DD -
// public read-only availability for the booking calendar on the detail page.
attachPublicAvailability(router, {
  itemType: 'transfer_route',
  collection: db.transferRoutes,
  notFoundMessage: 'Transfer route not found.',
});

module.exports = router;
