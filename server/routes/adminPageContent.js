const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  res.json(db.pageContent.get());
});

// PUT /api/admin/page-content - admin only
router.put('/', requireAdmin, (req, res) => {
  const updated = db.pageContent.update(req.body || {});
  db.adminLogs.create({
    admin_email: req.admin?.email,
    action: 'update',
    entity_type: 'page_content',
    entity_label: 'Page content',
  });
  res.json(updated);
});

module.exports = router;
