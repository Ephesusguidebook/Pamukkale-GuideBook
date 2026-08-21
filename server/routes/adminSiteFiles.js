const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAdmin);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await db.siteFiles.get());
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const updated = await db.siteFiles.update(req.body || {});
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'update',
      entity_type: 'site_files',
      entity_label: 'llms.txt / robots.txt',
    });
    res.json(updated);
  })
);

module.exports = router;
