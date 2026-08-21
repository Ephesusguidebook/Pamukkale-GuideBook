const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAdmin);

// Admin action log (who did what, and when).
router.get(
  '/activity',
  asyncHandler(async (req, res) => {
    res.json(await db.adminLogs.listRecent(req.query.limit));
  })
);

// Raw site-traffic log — every real page request, plus in-app pageview
// pings. Filter with ?bots=1 / ?human=1 / ?errors=1.
router.get(
  '/visits',
  asyncHandler(async (req, res) => {
    res.json(
      await db.visitLogs.listRecent({
        limit: req.query.limit,
        onlyBots: req.query.bots === '1',
        onlyHuman: req.query.human === '1',
        onlyErrors: req.query.errors === '1',
      })
    );
  })
);

// Quick dashboard numbers: bot vs. human traffic, crawl errors, and how
// many pages visitors browse per session.
router.get(
  '/visits/summary',
  asyncHandler(async (req, res) => {
    res.json(await db.visitLogs.summary());
  })
);

module.exports = router;
