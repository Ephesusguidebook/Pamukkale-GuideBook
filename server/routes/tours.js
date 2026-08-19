const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/tours - yayınlanan tüm turlar (herkese açık)
router.get('/', (req, res) => {
  res.json(db.tours.listPublished());
});

// GET /api/tours/:slug - tek tur detayı (herkese açık)
router.get('/:slug', (req, res) => {
  const tour = db.tours.getPublishedBySlug(req.params.slug);
  if (!tour) return res.status(404).json({ error: 'Tur bulunamadı.' });
  res.json(tour);
});

module.exports = router;
