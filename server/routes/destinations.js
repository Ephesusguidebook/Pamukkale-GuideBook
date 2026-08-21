const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await db.destinations.listPublished());
  })
);

// GET /api/destinations/:slug - the destination itself plus the published
// Attractions that belong to it (for the "Attractions" card grid on the
// destination detail page) in one round-trip.
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await db.destinations.getPublishedBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Destination not found.' });
    const attractions = await db.attractions.listPublishedByDestination(item.id);
    res.json({ ...item, attractions });
  })
);

module.exports = router;
