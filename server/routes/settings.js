const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings - herkese açık (danışman kartı için ön yüzde kullanılır)
router.get('/', (req, res) => {
  res.json(db.settings.get());
});

// PUT /api/settings - sadece admin
router.put('/', requireAdmin, (req, res) => {
  const updated = db.settings.update(req.body || {});
  db.adminLogs.create({
    admin_email: req.admin?.email,
    action: 'update',
    entity_type: 'settings',
    entity_label: 'Site settings',
  });
  res.json(updated);
});

module.exports = router;
