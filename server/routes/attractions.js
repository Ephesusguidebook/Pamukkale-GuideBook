const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// GET /api/attractions?destination=izmir-cruise-port - optional filter used
// by the /attraction listing page's "Filter by Destination" dropdown.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const destinationSlug = req.query.destination ? String(req.query.destination) : '';
    let items = await db.attractions.listPublished();
    if (destinationSlug) {
      const dest = await db.destinations.getPublishedBySlug(destinationSlug);
      items = dest ? items.filter((a) => a.destination_id === dest.id) : [];
    }
    res.json(items);
  })
);

// GET /api/attractions/:slug - the attraction, its parent Destination
// (auto-linked "Location", per the request), and nearby attractions in the
// same destination, all in one round-trip.
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await db.attractions.getPublishedBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Attraction not found.' });
    const [destination, nearby] = await Promise.all([
      item.destination_id ? db.destinations.getById(item.destination_id) : null,
      db.attractions.nearby(item),
    ]);
    res.json({
      ...item,
      destination: destination ? { id: destination.id, slug: destination.slug, title: destination.title } : null,
      nearby,
    });
  })
);

module.exports = router;
