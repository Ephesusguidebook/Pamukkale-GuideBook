const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  res.json(db.pageContent.get());
});

// PUT /api/admin/page-content - admin only
router.put('/', requireAdmin, (req, res) => {
  res.json(db.pageContent.update(req.body || {}));
});

module.exports = router;
