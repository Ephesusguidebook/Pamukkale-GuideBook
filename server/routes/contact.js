const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendContactNotification } = require('../lib/mailer');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// POST /api/contact - public, contact / enquiry form
// Also used by the Agency Login page's "Become a Partner" inline form,
// which collects a phone number but no email — so this only requires a
// name plus at least one way to reach the sender back (email or phone),
// rather than always requiring email.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name || (!b.email && !b.phone)) {
      return res.status(400).json({ error: 'Name and either an email or phone number are required.' });
    }
    const message = await db.contactMessages.create(b);
    res.status(201).json({ ok: true });

    // Fire-and-forget: never let email delivery delay or break the response.
    const settings = await db.settings.get();
    const notifyEmail = settings.notification_email;
    if (notifyEmail) {
      sendContactNotification(notifyEmail, message);
    }
  })
);

// GET /api/contact/admin/list - admin message list
router.get(
  '/admin/list',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await db.contactMessages.listWithItemTitle());
  })
);

router.put(
  '/admin/:id/read',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await db.contactMessages.markRead(req.params.id);
    res.json({ ok: true });
  })
);

module.exports = router;
