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
  while (db.tours.slugExists(slug, ignoreId)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// --- Tur listesi (taslaklar dahil) ---
router.get('/', (req, res) => {
  res.json(db.tours.listAll());
});

// --- Tek tur (düzenleme formu için) ---
router.get('/:id', (req, res) => {
  const tour = db.tours.getById(req.params.id);
  if (!tour) return res.status(404).json({ error: 'Tur bulunamadı.' });
  res.json(tour);
});

// --- Yeni tur oluştur ---
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) {
    return res.status(400).json({ error: 'Başlık zorunlu.' });
  }
  const slug = uniqueSlug(b.title);
  const tour = db.tours.create({ ...b, slug });
  res.status(201).json(tour);
});

// --- Tur güncelle ---
router.put('/:id', (req, res) => {
  const existing = db.tours.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tur bulunamadı.' });

  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) {
    return res.status(400).json({ error: 'Başlık zorunlu.' });
  }
  const slug =
    b.title !== existing.title ? uniqueSlug(b.title, existing.id) : existing.slug;

  const tour = db.tours.update(existing.id, { ...b, slug });
  res.json(tour);
});

// --- Tur sil ---
router.delete('/:id', (req, res) => {
  const ok = db.tours.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Tur bulunamadı.' });
  res.json({ ok: true });
});

module.exports = router;
