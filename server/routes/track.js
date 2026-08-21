const express = require('express');
const db = require('../db');
const { getOrSetSessionId } = require('../lib/session');
const { detectBot } = require('../lib/botDetect');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// Public endpoint the React app pings on every in-app route change, so
// "pages per session" can be counted for real visitors (this never fires
// for crawlers, since they don't run the app's JS).
router.post(
  '/pageview',
  asyncHandler(async (req, res) => {
    const botName = detectBot(req.headers['user-agent']);
    if (botName) return res.status(204).end();

    const sessionId = getOrSetSessionId(req, res);
    const pathValue = String((req.body && req.body.path) || '').slice(0, 300);
    if (!pathValue) return res.status(400).json({ error: 'path is required.' });

    await db.visitLogs.create({
      source: 'client',
      path: pathValue,
      status_code: 200,
      is_bot: false,
      session_id: sessionId,
      user_agent: req.headers['user-agent'] || '',
      referrer: (req.body && req.body.referrer) || req.headers['referer'] || '',
    });
    res.status(204).end();
  })
);

module.exports = router;
