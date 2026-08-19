const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const slugify = require('slugify');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// --- Görsel yükleme ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  },
});
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error('Desteklenmeyen dosya türü.'));
    cb(null, true);
  },
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// --- Yardımcılar ---
function uniqueSlug(title, ignoreId) {
  const base = slugify(title, { lower: true, strict: true, locale: 'tr' }) || 'tur';
  let slug = base;
  let i = 2;
  while (true) {
    const row = db.prepare('SELECT id FROM tours WHERE slug = ?').get(slug);
    if (!row || row.id === ignoreId) return slug;
    slug = `${base}-${i++}`;
  }
}

function attachRelations(tour) {
  const images = db
    .prepare('SELECT id, url, sort_order FROM tour_images WHERE tour_id = ? ORDER BY sort_order ASC, id ASC')
    .all(tour.id);
  const itinerary = db
    .prepare('SELECT id, day_number, title, details FROM tour_itinerary WHERE tour_id = ? ORDER BY day_number ASC, sort_order ASC')
    .all(tour.id);
  return { ...tour, images, itinerary };
}

function saveImages(tourId, images) {
  db.prepare('DELETE FROM tour_images WHERE tour_id = ?').run(tourId);
  const insert = db.prepare(
    'INSERT INTO tour_images (tour_id, url, sort_order) VALUES (?, ?, ?)'
  );
  (images || []).forEach((img, idx) => {
    const url = typeof img === 'string' ? img : img.url;
    if (url) insert.run(tourId, url, idx);
  });
}

function saveItinerary(tourId, itinerary) {
  db.prepare('DELETE FROM tour_itinerary WHERE tour_id = ?').run(tourId);
  const insert = db.prepare(
    'INSERT INTO tour_itinerary (tour_id, day_number, title, details, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  (itinerary || []).forEach((day, idx) => {
    insert.run(
      tourId,
      Number(day.day_number) || idx + 1,
      day.title || '',
      day.details || '',
      idx
    );
  });
}

// --- Tur listesi (taslaklar dahil) ---
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tours ORDER BY created_at DESC').all();
  res.json(rows.map(attachRelations));
});

// --- Tek tur (düzenleme formu için) ---
router.get('/:id', (req, res) => {
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
  if (!tour) return res.status(404).json({ error: 'Tur bulunamadı.' });
  res.json(attachRelations(tour));
});

// --- Yeni tur oluştur ---
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) {
    return res.status(400).json({ error: 'Başlık zorunlu.' });
  }
  const slug = uniqueSlug(b.title);
  const info = db
    .prepare(
      `INSERT INTO tours
        (slug, title, summary, description, price, currency, duration_days, location, start_date, capacity, status, cover_image, updated_at)
       VALUES (@slug, @title, @summary, @description, @price, @currency, @duration_days, @location, @start_date, @capacity, @status, @cover_image, CURRENT_TIMESTAMP)`
    )
    .run({
      slug,
      title: b.title,
      summary: b.summary || '',
      description: b.description || '',
      price: Number(b.price) || 0,
      currency: b.currency || 'TRY',
      duration_days: Number(b.duration_days) || 1,
      location: b.location || '',
      start_date: b.start_date || '',
      capacity: Number(b.capacity) || 0,
      status: b.status === 'draft' ? 'draft' : 'published',
      cover_image: b.cover_image || '',
    });

  const tourId = info.lastInsertRowid;
  saveImages(tourId, b.images);
  saveItinerary(tourId, b.itinerary);

  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(tourId);
  res.status(201).json(attachRelations(tour));
});

// --- Tur güncelle ---
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tur bulunamadı.' });

  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) {
    return res.status(400).json({ error: 'Başlık zorunlu.' });
  }
  const slug =
    b.title !== existing.title ? uniqueSlug(b.title, existing.id) : existing.slug;

  db.prepare(
    `UPDATE tours SET
      slug=@slug, title=@title, summary=@summary, description=@description,
      price=@price, currency=@currency, duration_days=@duration_days,
      location=@location, start_date=@start_date, capacity=@capacity,
      status=@status, cover_image=@cover_image, updated_at=CURRENT_TIMESTAMP
     WHERE id=@id`
  ).run({
    id: existing.id,
    slug,
    title: b.title,
    summary: b.summary || '',
    description: b.description || '',
    price: Number(b.price) || 0,
    currency: b.currency || 'TRY',
    duration_days: Number(b.duration_days) || 1,
    location: b.location || '',
    start_date: b.start_date || '',
    capacity: Number(b.capacity) || 0,
    status: b.status === 'draft' ? 'draft' : 'published',
    cover_image: b.cover_image || '',
  });

  saveImages(existing.id, b.images);
  saveItinerary(existing.id, b.itinerary);

  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(existing.id);
  res.json(attachRelations(tour));
});

// --- Tur sil ---
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM tours WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tur bulunamadı.' });
  db.prepare('DELETE FROM tours WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

module.exports = router;
