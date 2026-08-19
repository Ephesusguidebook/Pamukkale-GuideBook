const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendContactNotification } = require('../lib/mailer');

const router = express.Router();

// POST /api/contact - public, contact / enquiry form
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const message = db.contactMessages.create(b);
  res.status(201).json({ ok: true });

  // Fire-and-forget: never let email delivery delay or break the response.
  const notifyEmail = db.settings.get().notification_email;
  if (notifyEmail) {
    sendContactNotification(notifyEmail, message);
  }
});

// GET /api/contact/admin/list - admin message list
router.get('/admin/list', requireAdmin, (req, res) => {
  res.json(db.contactMessages.listWithItemTitle());
});

router.put('/admin/:id/read', requireAdmin, (req, res) => {
  db.contactMessages.markRead(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
