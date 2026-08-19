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
  db.prepare(
    `INSERT INTO contact_messages (tour_id, name, email, phone, message)
     VALUES (?, ?, ?, ?, ?)`
  ).run(b.tour_id || null, b.name, b.email, b.phone || '', b.message || '');
  res.status(201).json({ ok: true });
});

// GET /api/admin/contact - admin için mesaj listesi
router.get('/admin/list', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT cm.*, t.title AS tour_title
       FROM contact_messages cm
       LEFT JOIN tours t ON t.id = cm.tour_id
       ORDER BY cm.created_at DESC`
    )
    .all();
  res.json(rows);
});

router.put('/admin/:id/read', requireAdmin, (req, res) => {
  db.prepare("UPDATE contact_messages SET status = 'read' WHERE id = ?").run(
    req.params.id
  );
  res.json({ ok: true });
});

module.exports = router;
