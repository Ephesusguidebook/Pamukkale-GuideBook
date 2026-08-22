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
// Attractions (for the "Attractions" card grid) and Tours (for the "Things
// To Do" card grid) that belong to it, in one round-trip.
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await db.destinations.getPublishedBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Destination not found.' });
    const [attractions, tours] = await Promise.all([
      db.attractions.listPublishedByDestination(item.id),
      db.tours.listPublishedByDestination(item.id),
    ]);
    res.json({ ...item, attractions, tours });
  })
);

module.exports = router;
