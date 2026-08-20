const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', (req, res) => {
  res.json(db.siteFiles.get());
});

router.put('/', (req, res) => {
  const updated = db.siteFiles.update(req.body || {});
  db.adminLogs.create({
    admin_email: req.admin?.email,
    action: 'update',
    entity_type: 'site_files',
    entity_label: 'llms.txt / robots.txt',
  });
  res.json(updated);
});

module.exports = router;
