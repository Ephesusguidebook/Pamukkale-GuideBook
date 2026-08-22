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

// A Destination's title often carries a trailing qualifier — "(Örnek
// İçerik)" on demo content, or an admin might write "Bodrum (Muğla)" — so
// text-matching Transfer routes (which only have free-text pickup/dropoff,
// no destination_id) works off everything before the first "(" instead of
// the full title.
function destinationBaseName(title) {
  const idx = String(title || '').indexOf('(');
  return (idx > -1 ? title.slice(0, idx) : title).trim();
}

// GET /api/destinations/:slug - the destination itself plus the published
// Attractions (for the "Attractions" card grid), Tours (for the "Things To
// Do" card grid) that belong to it, and Transfer routes that involve it
// (matched by name, for the "/things-to-do/:slug" page), in one round-trip.
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await db.destinations.getPublishedBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Destination not found.' });
    const [attractions, tours, transfers] = await Promise.all([
      db.attractions.listPublishedByDestination(item.id),
      db.tours.listPublishedByDestination(item.id),
      db.transferRoutes.listPublishedMatchingText(destinationBaseName(item.title)),
    ]);
    res.json({ ...item, attractions, tours, transfers });
  })
);

module.exports = router;
