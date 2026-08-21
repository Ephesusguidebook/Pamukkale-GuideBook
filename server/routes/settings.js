const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// GET /api/settings - herkese açık (danışman kartı için ön yüzde kullanılır)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await db.settings.get());
  })
);

// PUT /api/settings - sadece admin
router.put(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const updated = await db.settings.update(req.body || {});
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'update',
      entity_type: 'settings',
      entity_label: 'Site settings',
    });
    res.json(updated);
  })
);

module.exports = router;
