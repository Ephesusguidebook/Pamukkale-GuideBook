const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await db.pageContent.get());
  })
);

// PUT /api/admin/page-content - admin only
router.put(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const updated = await db.pageContent.update(req.body || {});
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'update',
      entity_type: 'page_content',
      entity_label: 'Page content',
    });
    res.json(updated);
  })
);

module.exports = router;
