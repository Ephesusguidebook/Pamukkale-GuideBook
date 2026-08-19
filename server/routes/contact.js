const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact - herkese açık, iletişim/talep formu
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email) {
    return res.status(400).json({ error: 'İsim ve e-posta zorunlu.' });
  }
  db.contactMessages.create(b);
  res.status(201).json({ ok: true });
});

// GET /api/admin/contact - admin için mesaj listesi
router.get('/admin/list', requireAdmin, (req, res) => {
  res.json(db.contactMessages.listWithTourTitle());
});

router.put('/admin/:id/read', requireAdmin, (req, res) => {
  db.contactMessages.markRead(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
