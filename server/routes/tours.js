const express = require('express');
const db = require('../db');

const router = express.Router();

function attachRelations(tour) {
  const images = db
    .prepare('SELECT id, url, sort_order FROM tour_images WHERE tour_id = ? ORDER BY sort_order ASC, id ASC')
    .all(tour.id);
  const itinerary = db
    .prepare('SELECT id, day_number, title, details FROM tour_itinerary WHERE tour_id = ? ORDER BY day_number ASC, sort_order ASC')
    .all(tour.id);
  return { ...tour, images, itinerary };
}

// GET /api/tours - yayınlanan tüm turlar (herkese açık)
router.get('/', (req, res) => {
  const rows = db
    .prepare("SELECT * FROM tours WHERE status = 'published' ORDER BY created_at DESC")
    .all();
  res.json(rows.map(attachRelations));
});

// GET /api/tours/:slug - tek tur detayı (herkese açık)
router.get('/:slug', (req, res) => {
  const tour = db
    .prepare("SELECT * FROM tours WHERE slug = ? AND status = 'published'")
    .get(req.params.slug);
  if (!tour) return res.status(404).json({ error: 'Tur bulunamadı.' });
  res.json(attachRelations(tour));
});

module.exports = router;
